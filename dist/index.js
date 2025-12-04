var R = Object.defineProperty;
var q = (o, e, t) => e in o ? R(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var d = (o, e, t) => q(o, typeof e != "symbol" ? e + "" : e, t);
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
const h = {
  get: "get",
  head: "head"
}, A = {
  post: "post",
  put: "put",
  delete: "delete"
}, p = {
  ...A,
  ...h
}, H = /* @__PURE__ */ new Set([
  ...Object.values(h),
  ...Object.values(h).map((o) => o.toUpperCase())
]), k = /* @__PURE__ */ new Set([
  ...Object.values(p),
  ...Object.values(p).map((o) => o.toUpperCase())
]), y = (o) => H.has(o), M = (o) => k.has(o);
class w {
  static FormDataForNoBodyMethods() {
    return `Wrong params. FormData cannot be included in queries [${Object.values(h).reduce((t, s, r) => t + (r > 0 ? `, ${s}` : s), "")}]`;
  }
  static WrongTypeResponse() {
    return "Wrong type response";
  }
}
class l {
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
const T = "Authorization";
class x {
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
    this._token != null && this._addHeader(e, T, this._token);
  }
  _addTokenIfNoExist(e) {
    this._headersHas(e, T) || this._addToken(e);
  }
  _addHeaderIfNoExist(e, t, s) {
    this._headersHas(e, t) || this._addHeader(e, t, s);
  }
  _createUrl(e, t, s) {
    const r = new URLSearchParams();
    if (y(e)) {
      if (s instanceof FormData)
        throw new i(
          {
            message: w.FormDataForNoBodyMethods(),
            status: 0,
            statusText: ""
          }
        );
      s && Object.entries(s).forEach(([u, n]) => {
        (Array.isArray(n) ? n : [n]).forEach((_) => {
          (typeof _ == "string" || typeof _ == "number" || typeof _ == "boolean") && r.append(u, _.toString());
        });
      });
    }
    const a = r.toString();
    return a ? `${t}?${a}` : t;
  }
  getToken() {
    return this._token;
  }
  setToken(e) {
    this._token = e;
  }
}
class b extends x {
  _createRequestInit(e, t, s) {
    const r = t && (t instanceof FormData || t instanceof ReadableStream) ? t : JSON.stringify(t), a = {
      method: e.toUpperCase(),
      headers: new Headers(),
      ...s,
      ...!y(e) && {
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
          response: new l({
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
      return new l({
        data: r,
        status: s.status,
        statusText: s.statusText,
        headers: s.headers
      });
    } catch (r) {
      throw r instanceof i ? r : new i(
        {
          message: w.WrongTypeResponse(),
          status: s.status,
          statusText: s.statusText
        }
      );
    }
  }
  request(e, t, s, r) {
    const a = this._createUrl(e, t, s), u = this._createRequestInit(e, s, r), n = new Request(a, u);
    return this._fetch(n, r);
  }
}
class E extends x {
  _addHeaders(e, t) {
    let s = t == null ? void 0 : t.headers;
    if (this._token != null && (s || (s = new Headers()), this._addToken(s)), !s)
      return;
    const r = Array.isArray(s) ? s.values() : s instanceof Headers ? s.entries() : Object.entries(s);
    for (const [a, u] of r)
      e.setRequestHeader(a, u);
  }
  _createHeaders(e) {
    const t = new Headers();
    return e.trim().split(/[\r\n]+/).forEach((r) => {
      const a = r.split(": "), u = a.shift(), n = a.join(": ");
      u && t.append(u, n);
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
      response: new l({
        data: this._formatResponse(e),
        status: e.status,
        statusText: e.statusText,
        headers: this._createHeaders(e.getAllResponseHeaders())
      })
    });
  }
  _onload(e, t, s) {
    e.onload = () => {
      e.status >= 200 && e.status <= 299 ? t(new l({
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
    return new Promise((a, u) => {
      const n = new XMLHttpRequest();
      n.responseType = (r == null ? void 0 : r.responseType) || "", n.open(e.toUpperCase(), this._createUrl(e, t, s)), this._addHeaders(n, r);
      const c = s && (s instanceof FormData ? s : JSON.stringify(s));
      this._onload(n, a, u), this._onerror(n, u), this._onprogress(n, r), n.send(c);
    });
  }
}
class N {
  static createRequestAdapter(e, t) {
    return t != null && t.onUploadProgress || t != null && t.onDownloadProgress ? new E() : new b();
  }
}
class O {
  constructor() {
    d(this, "_token");
  }
  request(e, t, s, r) {
    const a = N.createRequestAdapter(e, r);
    return this._token && a.setToken(this._token), a.request(e, t, s, r);
  }
  setToken(e) {
    this._token = e;
  }
}
export {
  i as ApiError,
  l as ApiResponse,
  A as BodyRequestMethod,
  H as NoBodyMethods,
  h as NoBodyRequestMethod,
  p as RequestMethod,
  k as RequestMethods,
  O as default,
  y as isNoBodyRequestMethod,
  M as isRequestMethod
};
