import { useState } from "react";
import { controlGroups, type PlaygroundControl, type PlaygroundEnvironment, type PlaygroundRecord, type PlaygroundState } from "./types.js";

export function ControlPanel<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>({
  state,
  controls,
  onChange,
}: {
  state: PlaygroundState<Props, Environment>;
  controls: readonly PlaygroundControl<Props, Environment>[];
  onChange(scope: "props" | "environment", key: string, value: PlaygroundRecord[string]): void;
}) {
  const [openGroups, setOpenGroups] = useState(() => new Set(["Content", "Appearance"]));

  function setGroupOpen(group: string, open: boolean) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (open) next.add(group);
      else next.delete(group);
      return next;
    });
  }

  return (
    <div className="playground-control-groups">
      {controlGroups.map((group) => {
        const visible = controls.filter((control) => control.group === group && control.visible?.(state) !== false);
        if (!visible.length) return null;
        return (
          <details key={group} open={openGroups.has(group)} onToggle={(event) => setGroupOpen(group, event.currentTarget.open)}>
            <summary><span>{group}</span><span>{visible.length}</span></summary>
            <div className="playground-control-list">
              {visible.map((control) => (
                <ControlField key={control.scope + "." + control.key} control={control} value={state[control.scope][control.key]} onChange={(value) => onChange(control.scope, control.key, value)} />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ControlField<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>({
  control,
  value,
  onChange,
}: {
  control: PlaygroundControl<Props, Environment>;
  value: PlaygroundRecord[string];
  onChange(value: PlaygroundRecord[string]): void;
}) {
  const id = "playground-control-" + control.scope + "-" + control.key;
  const coordinate = control.scope + "." + control.key;
  if (control.type === "boolean") {
    return (
      <label className="playground-switch" htmlFor={id} data-playground-control={coordinate}>
        <span><strong>{control.label}</strong>{control.description ? <small>{control.description}</small> : null}</span>
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.currentTarget.checked)} />
        <i aria-hidden="true" />
      </label>
    );
  }
  if (control.type === "segmented") {
    return (
      <fieldset className="playground-field" data-playground-control={coordinate}>
        <legend>{control.label}</legend>
        {control.description ? <small>{control.description}</small> : null}
        <div className="playground-segmented">
          {control.options.map((option) => (
            <label key={option.value}>
              <input type="radio" name={id} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (control.type === "select") {
    return (
      <label className="playground-field" htmlFor={id} data-playground-control={coordinate}>
        <span>{control.label}</span>
        {control.description ? <small>{control.description}</small> : null}
        <select id={id} value={String(value)} onChange={(event) => onChange(event.currentTarget.value)}>
          {control.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    );
  }
  if (control.type === "range") {
    return (
      <label className="playground-field playground-range" htmlFor={id} data-playground-control={coordinate}>
        <span>{control.label}<output htmlFor={id}>{String(value)}{control.unit}</output></span>
        {control.description ? <small>{control.description}</small> : null}
        <input id={id} type="range" min={control.min} max={control.max} step={control.step ?? 1} value={Number(value)} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} />
      </label>
    );
  }
  return (
    <label className="playground-field" htmlFor={id} data-playground-control={coordinate}>
      <span>{control.label}</span>
      {control.description ? <small>{control.description}</small> : null}
      {control.type === "textarea"
        ? <textarea id={id} rows={3} value={String(value)} placeholder={"placeholder" in control ? control.placeholder : undefined} onChange={(event) => onChange(event.currentTarget.value)} />
        : <input id={id} type="text" value={String(value)} placeholder={"placeholder" in control ? control.placeholder : undefined} onChange={(event) => onChange(event.currentTarget.value)} />}
    </label>
  );
}
