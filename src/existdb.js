export function authHeader(user, password) {
  if (!user && !password) return {};
  const encoded = btoa(`${user}:${password}`);
  return { Authorization: `Basic ${encoded}` };
}

async function proxyFetch(body, proxy) {
  const res = await fetch(`${proxy}/proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("exist-network");
  return res;
}

export async function listCollection(url, collection, user, password, proxy) {
  try {
    const fetchArgs = {
      headers: authHeader(user, password),
    };
    const res = proxy
      ? await proxyFetch(
          {
            url,
            path: `/rest${collection}/`,
            method: "GET",
            headers: fetchArgs.headers,
          },
          proxy,
        )
      : await fetch(`${url}/rest${collection}/`, fetchArgs);
    if (!res.ok) throw new Error("exist-list");
    const text = await res.text();
    const dom = new DOMParser().parseFromString(text, "text/xml");
    return Array.from(dom.getElementsByTagName("exist:resource"))
      .map((e) => e.getAttribute("name"))
      .filter((n) => n && n.endsWith(".xml"));
  } catch (e) {
    if (e.name === "TypeError") throw new Error("exist-network");
    throw e;
  }
}

export async function fetchFile(url, collection, name, user, password, proxy) {
  try {
    const fetchArgs = { headers: authHeader(user, password) };
    const res = proxy
      ? await proxyFetch(
          {
            url,
            path: `/rest${collection}/${name}`,
            method: "GET",
            headers: fetchArgs.headers,
          },
          proxy,
        )
      : await fetch(`${url}/rest${collection}/${name}`, fetchArgs);
    if (!res.ok) throw new Error("exist-fetch");
    return await res.text();
  } catch (e) {
    if (e.name === "TypeError") throw new Error("exist-network");
    throw e;
  }
}

export async function writeFile(
  url,
  collection,
  name,
  xml,
  user,
  password,
  proxy,
) {
  try {
    const headers = {
      "Content-Type": "application/xml",
      ...authHeader(user, password),
    };
    const body = xml;
    const res = proxy
      ? await proxyFetch(
          {
            url,
            path: `/rest${collection}/${name}`,
            method: "PUT",
            headers,
            body,
          },
          proxy,
        )
      : await fetch(`${url}/rest${collection}/${name}`, {
          method: "PUT",
          headers,
          body,
        });
    if (!res.ok) throw new Error("exist-save");
  } catch (e) {
    if (e.name === "TypeError") throw new Error("exist-network");
    throw e;
  }
}
