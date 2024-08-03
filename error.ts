import { is } from "jsr:@core/unknownutil@^4.0.0";
import {
  fromErrorObject,
  isErrorObject,
  toErrorObject,
  tryOr,
} from "jsr:@lambdalisue/errorutil@^1.0.0";

export function errorSerializer(err: unknown): unknown {
  if (err instanceof Error) {
    return JSON.stringify(toErrorObject(err));
  }
  return String(err);
}

export function errorDeserializer(err: unknown): unknown {
  if (is.String(err)) {
    const obj = tryOr(() => JSON.parse(err), undefined);
    if (isErrorObject(obj)) {
      return fromErrorObject(obj);
    }
  }
  return err;
}
