export interface HandlerMap {
  [name: string]: HandlerFunction;
}

export interface HandlerFunction {
  (args: HandlerFunctionArgs): void;
}

export interface HandlerFunctionArgs {
  node: Node;
  attribute: Attr;
  dataValue: any;
  handlers: HandlerMap;
}

export default function stamp(
  template: HTMLTemplateElement,
  data: object,
  attributeHandlers = {}
);
