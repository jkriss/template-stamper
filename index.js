const slice = Array.prototype.slice;

function walk(nodes, cb) {
  if (!("length" in nodes)) {
    nodes = [nodes];
  }

  nodes = slice.call(nodes);

  while (nodes.length) {
    var node = nodes.shift(),
      ret = cb(node);

    if (ret) {
      return ret;
    }

    if (node.childNodes && node.childNodes.length) {
      nodes = slice.call(node.childNodes).concat(nodes);
    }
  }
}

const braceRegex = /{\s*(.*?)\s*}/g;
const braceRegexOne = /{\s*(.*?)\s*}/;

function getDot(obj, key) {
  let result = obj;
  for (const property of key.split(".")) {
    result = result ? result[property] : "";
  }
  return result;
}

function getKey(templateStr) {
  const m = templateStr.match(braceRegexOne);
  return m && m[1];
}

function t(template, data) {
  return template.replace(braceRegex, (_, key) => {
    return String(getDot(data, key));
  });
}

export default function stamp(template, data) {
  const clone = template.content.cloneNode(true);
  walk(clone, (node) => {
    if (node.attributes) {
      const toRemove = [];
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        const key = getKey(attr.value);
        const val = key && getDot(data, key);

        const keep = (b, key) => {
          b ? toRemove.push(key) : node.remove();
        };

        if (attr.name === "if") {
          keep(val, attr.name);
        } else if (attr.name === "unless") {
          keep(!val, attr.name);
        } else if (attr.name === "each") {
          toRemove.push("each");
          if (val) {
            const t = document.createElement("template");
            t.innerHTML = node.innerHTML;
            node.innerHTML = "";
            val.forEach((subVal, i) => {
              const itemData = { "#": i, this: subVal };
              node.appendChild(stamp(t, itemData));
            });
          } else {
            node.remove();
          }
        } else if (attr.name === "html") {
          node.innerHTML = val;
          toRemove.push("html");
        } else {
          // special handling for event listeners
          const m = attr.name.match(/^on(.*)/);
          if (m) {
            if (val) node.addEventListener(m[1], val);
            toRemove.push(attr.name);
          } else if (val) {
            attr.value = val;
          }
        }
      }
      toRemove.map(node.removeAttribute.bind(node));
    }
    if (node instanceof Text) {
      node.textContent = t(node.textContent, data);
    }
  });
  return clone;
}
