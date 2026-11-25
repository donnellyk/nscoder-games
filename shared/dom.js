// Minimal declarative DOM builder. Text children become TextNodes (never
// innerHTML), so player and item names are safe by construction.
export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  });

  [].concat(children)
    .filter((child) => child !== undefined && child !== null && child !== false && child !== '')
    .forEach((child) => node.append(child instanceof Node ? child : document.createTextNode(String(child))));

  return node;
};

export const classNames = (...parts) => parts.filter(Boolean).join(' ');
