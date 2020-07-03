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

const removeAttr = (node, attrName) => {
  node.removeAttribute(attrName);
};

const keep = (node, keepIt, key) => {
  keepIt ? removeAttr(node, key) : node.remove();
};

export const defaultHandlers = {
  if: ({ node, attribute, dataValue }) => {
    keep(node, dataValue, attribute.name);
  },
  unless: ({ node, attribute, dataValue }) => {
    keep(node, !dataValue, attribute.name);
  },
  html: ({ node, attribute, dataValue }) => {
    node.innerHTML = dataValue;
    removeAttr(node, attribute.name);
  },
  each: ({ node, attribute, dataValue, handlers }) => {
    if (dataValue) {
      const t = document.createElement("template");
      t.innerHTML = node.innerHTML;
      node.innerHTML = "";
      dataValue.forEach((subVal, i) => {
        const itemData = { "#": i, this: subVal };
        node.appendChild(stamp(t, itemData, handlers));
      });
    } else {
      node.remove();
    }
  },
};

export default function stamp(template, data, attributeHandlers = {}) {
  const handlers = Object.assign({}, defaultHandlers, attributeHandlers);
  const clone = template.content.cloneNode(true);
  walk(clone, (node) => {
    if (node.attributes) {
      const toRemove = [];

      Array.from(node.attributes).forEach((attr) => {
        const key = getKey(attr.value);
        const val = key && getDot(data, key);

        const fn = handlers[attr.name];
        if (fn) {
          fn({ node, attribute: attr, dataValue: val, handlers });
        } else {
          // special handling for event listeners
          const m = attr.name.match(/^on(.*)/);
          if (m) {
            if (val) node.addEventListener(m[1], val);
            node.removeAttribute(attr.name);
          } else if (val) {
            attr.value = val;
          }
        }
      });
    }
    if (node instanceof Text) {
      node.textContent = t(node.textContent, data);
    }
  });
  return clone;
}
