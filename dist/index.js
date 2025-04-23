var x = Object.defineProperty;
var R = (o, e, t) => e in o ? x(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var d = (o, e, t) => R(o, typeof e != "symbol" ? e + "" : e, t);
class i extends Error {
  constructor({
    message: t,
    status: s,
    statusText: r,
    response: a
  }) {
    super(t);
    d(this, "_status");
    d(this, "_statusText");
    d(this, "_response");
    this._status = s, this._statusText = r, this._response = a;
  }
  get status() {
    return this._status;
  }
  get statusText() {
    return this._statusText;
  }
  get response() {
    return this._response;
  }
}
const _ = {
  get: "get",
  head: "head"
}, q = {
  post: "post",
  put: "put",
  delete: "delete"
}, l = {
  ...q,
  ..._
}, H = /* @__PURE__ */ new Set([
  ...Object.values(_),
  ...Object.values(_).map((o) => o.toUpperCase())
]), A = /* @__PURE__ */ new Set([
  ...Object.values(l),
  ...Object.values(l).map((o) => o.toUpperCase())
]), c = (o) => H.has(o), M = (o) => A.has(o);
class T {
  static FormDataForNoBodyMethods() {
    return `Wrong params. FormData cannot be included in queries [${Object.values(_).reduce((t, s, r) => t + (r > 0 ? `, ${s}` : s), "")}]`;
  }
  static WrongTypeResponse() {
    return "Wrong type response";
  }
}
class h {
  constructor({
    data: e,
    status: t,
    statusText: s,
    headers: r
  }) {
    d(this, "_data");
    d(this, "_status");
    d(this, "_statusText");
    d(this, "_headers");
    this._data = e, this._status = t, this._statusText = s, this._headers = r;
  }
  get data() {
    return this._data;
  }
  get status() {
    return this._status;
  }
  get statusText() {
    return this._statusText;
  }
  get headers() {
    return this._headers;
  }
}
const p = "Authorization";
class y {
  constructor() {
    d(this, "_token");
  }
  _headersHas(e, t) {
    const s = t.toLowerCase();
    return e instanceof Headers ? e.has(t) : Array.isArray(e) ? !!e.find((r) => r[0].toLowerCase() === s) : !!Object.keys(e).find((r) => r.toLowerCase() === s);
  }
  _addHeader(e, t, s) {
    Array.isArray(e) ? e.push([t, s]) : e instanceof Headers ? e.append(t, s) : e[t] = s;
  }
  _addToken(e) {
    this._token != null && this._addHeader(e, p, this._token);
  }
  _addTokenIfNoExist(e) {
    this._headersHas(e, p) || this._addToken(e);
  }
  _addHeaderIfNoExist(e, t, s) {
    this._headersHas(e, t) || this._addHeader(e, t, s);
  }
  _createUrl(e, t, s) {
    const r = new URLSearchParams();
    if (c(e)) {
      if (s instanceof FormData)
        throw new i(
          {
            message: T.FormDataForNoBodyMethods(),
            status: 0,
            statusText: ""
          }
        );
      s && Object.entries(s).forEach(([a, n]) => {
        (typeof n == "string" || typeof n == "number" || typeof n == "boolean") && r.append(a, n.toString());
      });
    }
    return r.size ? `${t}?${r.toString()}` : t;
  }
  getToken() {
    return this._token;
  }
  setToken(e) {
    this._token = e;
  }
}
class k extends y {
  _createRequestInit(e, t, s) {
    const r = t && t instanceof FormData ? t : JSON.stringify(t), a = {
      method: e.toUpperCase(),
      headers: new Headers(),
      ...s,
      ...!c(e) && {
        body: r
      }
    };
    return this._addTokenIfNoExist(a.headers), a;
  }
  async _getDataFromResponse(e, t) {
    const s = t == null ? void 0 : t.responseType;
    let r = "";
    switch (s) {
      case "blob":
      case "json":
        r = await e[s]();
        break;
      case "arraybuffer":
        r = await e.arrayBuffer();
        break;
      case "text":
      default: {
        const a = await e.text();
        if (r = a, (t == null ? void 0 : t.responseType) == null)
          try {
            r = JSON.parse(a);
          } catch {
            r = a;
          }
      }
    }
    if (!e.ok)
      throw new i(
        {
          message: e.statusText,
          status: e.status,
          statusText: e.statusText,
          response: new h({
            data: r,
            status: e.status,
            statusText: e.statusText,
            headers: e.headers
          })
        }
      );
    return Promise.resolve(r);
  }
  async _fetch(e, t) {
    const s = await fetch(e);
    try {
      const r = await this._getDataFromResponse(s, t);
      return new h({
        data: r,
        status: s.status,
        statusText: s.statusText,
        headers: s.headers
      });
    } catch (r) {
      throw r instanceof i ? r : new i(
        {
          message: T.WrongTypeResponse(),
          status: s.status,
          statusText: s.statusText
        }
      );
    }
  }
  request(e, t, s, r) {
    const a = this._createUrl(e, t, s), n = this._createRequestInit(e, s, r), u = new Request(a, n);
    return this._fetch(u, r);
  }
}
class b extends y {
  _addHeaders(e, t) {
    let s = t == null ? void 0 : t.headers;
    if (this._token != null && (s || (s = new Headers()), this._addToken(s)), !s)
      return;
    const r = Array.isArray(s) ? s.values() : s instanceof Headers ? s.entries() : Object.entries(s);
    for (const [a, n] of r)
      e.setRequestHeader(a, n);
  }
  _createHeaders(e) {
    const t = new Headers();
    return e.trim().split(/[\r\n]+/).forEach((r) => {
      const a = r.split(": "), n = a.shift(), u = a.join(": ");
      n && t.append(n, u);
    }), t;
  }
  _formatResponse(e) {
    let t = e.response;
    if (e.responseType === "" && typeof t == "string")
      try {
        t = JSON.parse(t);
      } catch {
        t = e.response;
      }
    return t;
  }
  _createError(e) {
    return new i({
      message: e.statusText,
      status: e.status,
      statusText: e.statusText,
      response: new h({
        data: this._formatResponse(e),
        status: e.status,
        statusText: e.statusText,
        headers: this._createHeaders(e.getAllResponseHeaders())
      })
    });
  }
  _onload(e, t, s) {
    e.onload = () => {
      e.status >= 200 && e.status <= 299 ? t(new h({
        data: this._formatResponse(e),
        status: e.status,
        statusText: e.statusText,
        headers: this._createHeaders(e.getAllResponseHeaders())
      })) : s(this._createError(e));
    };
  }
  _onerror(e, t) {
    e.onerror = () => {
      t(this._createError(e));
    };
  }
  _onprogress(e, t) {
    e.upload.onprogress = (s) => {
      var r;
      (r = t == null ? void 0 : t.onUploadProgress) == null || r.call(t, {
        loaded: s.loaded,
        total: s.total,
        ...s.total ? { progress: s.loaded / s.total } : void 0
      });
    }, e.onprogress = (s) => {
      var r;
      (r = t == null ? void 0 : t.onDownloadProgress) == null || r.call(t, {
        loaded: s.loaded,
        total: s.total,
        ...s.total ? { progress: s.loaded / s.total } : void 0
      });
    };
  }
  request(e, t, s, r) {
    return new Promise((a, n) => {
      const u = new XMLHttpRequest();
      u.responseType = (r == null ? void 0 : r.responseType) || "", u.open(e.toUpperCase(), this._createUrl(e, t, s)), this._addHeaders(u, r);
      const w = s && (s instanceof FormData ? s : JSON.stringify(s));
      this._onload(u, a, n), this._onerror(u, n), this._onprogress(u, r), u.send(w);
    });
  }
}
class E {
  static createRequestAdapter(e, t) {
    return t != null && t.onUploadProgress || t != null && t.onDownloadProgress ? new b() : new k();
  }
}
class O {
  constructor() {
    d(this, "_token");
  }
  request(e, t, s, r) {
    const a = E.createRequestAdapter(e, r);
    return this._token && a.setToken(this._token), a.request(e, t, s, r);
  }
  setToken(e) {
    this._token = e;
  }
}
export {
  i as ApiError,
  h as ApiResponse,
  q as BodyRequestMethod,
  H as NoBodyMethods,
  _ as NoBodyRequestMethod,
  l as RequestMethod,
  A as RequestMethods,
  O as default,
  c as isNoBodyRequestMethod,
  M as isRequestMethod
};
