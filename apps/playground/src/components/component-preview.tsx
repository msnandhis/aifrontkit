import type { MessagePartComponents } from "@aifrontkit/react/message";
import { File } from "../../../../registry/react/css/components/file/file.js";
import { ComponentPlayground } from "../playground/playground.js";
import { getPlaygroundDefinition } from "../playground/definitions/index.js";
import type { ComponentName } from "../playground/types.js";

/** The documented renderer shape is typechecked against the public primitive contract. */
export const messagePartComponentsExample: MessagePartComponents = {
  file: ({ part }) => <File file={part} />,
};

export function ComponentPreview({ component }: { component: ComponentName }) {
  return <ComponentPlayground key={component} definition={getPlaygroundDefinition(component)} />;
}
