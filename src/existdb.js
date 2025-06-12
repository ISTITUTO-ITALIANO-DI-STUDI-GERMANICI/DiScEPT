export function authHeader(user, password) {
  if (!user && !password) return {};
  const encoded = btoa(`${user}:${password}`);
  return { Authorization: `Basic ${encoded}` };
}

export async function listCollection(url, collection, user, password) {
  try {
    const res = await fetch(`${url}/rest${collection}/`, {
      headers: authHeader(user, password),
    });
    if (!res.ok) throw new Error('exist-list');
    const text = await res.text();
    const dom = new DOMParser().parseFromString(text, 'text/xml');
    return Array.from(dom.getElementsByTagName('exist:resource'))
      .map((e) => e.getAttribute('name'))
      .filter((n) => n && n.endsWith('.xml'));
  } catch (e) {
    if (e.name === 'TypeError') throw new Error('exist-network');
    throw e;
  }
}

export async function fetchFile(url, collection, name, user, password) {
  try {
    const res = await fetch(`${url}/rest${collection}/${name}`, {
      headers: authHeader(user, password),
    });
    if (!res.ok) throw new Error('exist-fetch');
    return await res.text();
  } catch (e) {
    if (e.name === 'TypeError') throw new Error('exist-network');
    throw e;
  }
}

export async function writeFile(url, collection, name, xml, user, password) {
  try {
    const res = await fetch(`${url}/rest${collection}/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml',
        ...authHeader(user, password),
      },
      body: xml,
    });
    if (!res.ok) throw new Error('exist-save');
  } catch (e) {
    if (e.name === 'TypeError') throw new Error('exist-network');
    throw e;
  }
}
