import { request, type Dispatcher } from "undici";
import { log } from "./logger.js";
import { ResponseCache } from "./cache.js";

/**
 * Client de l'API open data BOFiP-Impôts (DGFiP).
 *
 * Le BOFiP n'est PAS accessible via PISTE/Légifrance (le fond CIRC ne
 * l'indexe pas, et /consult/circulaire renvoie 400 sur les ids BOI- —
 * vérifié en réel le 11 juin 2026). La DGFiP le publie en open data sur
 * data.economie.gouv.fr (OpenDataSoft), sans authentification, sous
 * Licence Ouverte 2.0 :
 *   - dataset `bofip-vigueur` : doctrine en vigueur (~9 000 fiches)
 *   - dataset `bofip-impots` : historique complet (versions abrogées incluses)
 *
 * Champs des records : type, titre, debut_de_validite, serie, division,
 * identifiant_juridique, permalien, contenu (texte brut), contenu_html.
 */

const BOFIP_API_BASE = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets";
const MAX_RETRIES_429 = 3;
const RETRY_5XX_DELAY_MS = 2000;

export class BofipApiError extends Error {
  constructor(
    public status: number,
    public dataset: string,
    body: string,
  ) {
    super(
      `API open data BOFiP (data.economie.gouv.fr) HTTP ${status} sur le dataset ${dataset}: ${body.slice(0, 300)}. Cette API est distincte de PISTE — un problème ici n'est PAS un problème de credentials PISTE.`,
    );
    this.name = "BofipApiError";
  }
}

export interface BofipClientOptions {
  /** Inject a dispatcher (for tests/MockAgent). */
  dispatcher?: Dispatcher;
  /** Override the sleep function (for tests). */
  sleep?: (ms: number) => Promise<void>;
  /** Optional response cache (shared with the PISTE client). */
  cache?: ResponseCache;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** TTL cache : la doctrine BOFiP est mise à jour par vagues hebdomadaires. */
const BOFIP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class BofipClient {
  private dispatcher?: Dispatcher;
  private sleep: (ms: number) => Promise<void>;
  cache?: ResponseCache;

  constructor(opts: BofipClientOptions = {}) {
    this.dispatcher = opts.dispatcher;
    this.sleep = opts.sleep ?? defaultSleep;
    this.cache = opts.cache;
  }

  /**
   * GET /…/datasets/<dataset>/records avec les query params ODS
   * (where, select, limit, order_by…). Pas d'auth. Retry 429 (backoff 3x)
   * et 5xx (1x), cache 24h.
   */
  async records<T = unknown>(dataset: string, params: Record<string, string>): Promise<T> {
    const cacheKey = `GET bofip/${dataset}/records`;
    const paramsHash = this.cache ? ResponseCache.hash(params) : "";
    if (this.cache) {
      const cached = this.cache.get<T>(cacheKey, paramsHash);
      if (cached !== undefined) {
        log.debug("cache hit", { api: "bofip", dataset });
        return cached;
      }
    }

    const qs = new URLSearchParams(params).toString();
    const url = `${BOFIP_API_BASE}/${dataset}/records?${qs}`;

    let attempt429 = 0;
    let attempt5xx = 0;

    while (true) {
      const start = Date.now();
      const res = await request(url, {
        method: "GET",
        headers: { accept: "application/json" },
        dispatcher: this.dispatcher,
      });
      const text = await res.body.text();
      const elapsedMs = Date.now() - start;

      if (res.statusCode === 200) {
        log.debug("bofip api ok", { dataset, ms: elapsedMs });
        const parsed = JSON.parse(text) as T;
        if (this.cache) this.cache.set(cacheKey, paramsHash, parsed, BOFIP_CACHE_TTL_MS);
        return parsed;
      }

      if (res.statusCode === 429 && attempt429 < MAX_RETRIES_429) {
        const delay = Math.min(2 ** attempt429 * 1000, 8000);
        log.warn("bofip api 429, backoff", { dataset, attempt: attempt429 + 1, delayMs: delay });
        attempt429 += 1;
        await this.sleep(delay);
        continue;
      }

      if (res.statusCode >= 500 && res.statusCode < 600 && attempt5xx === 0) {
        log.warn("bofip api 5xx, retry once", { dataset, status: res.statusCode });
        attempt5xx += 1;
        await this.sleep(RETRY_5XX_DELAY_MS);
        continue;
      }

      log.error("bofip api error", { dataset, status: res.statusCode, body: text.slice(0, 300) });
      throw new BofipApiError(res.statusCode, dataset, text);
    }
  }
}

/**
 * Échappe une valeur pour un littéral string ODSQL (clause `where`).
 * Les guillemets doubles sont retirés (aucun identifiant ni terme de
 * recherche BOFiP légitime n'en contient) pour fermer toute injection.
 */
export function odsqlString(value: string): string {
  return `"${value.replace(/["\\]/g, " ").trim()}"`;
}

/**
 * Normalise un identifiant BOFiP cité : retire un éventuel suffixe de
 * version `-YYYYMMDD` (les permaliens l'incluent, le champ
 * identifiant_juridique du dataset ne l'a pas) et les espaces parasites.
 */
export function normalizeBoiId(id: string): string {
  return id.trim().replace(/-\d{8}$/, "");
}
