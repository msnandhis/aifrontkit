import { Icon } from "../components/icons.js";

export function PlaygroundEvents({ event }: { event: string }) {
  return (
    <details className="playground-events">
      <summary>
        <strong>Events</strong>
        <span className="playground-events-status" role="status" aria-live="polite">{event}</span>
        <Icon name="chevron" />
      </summary>
      <div className="playground-events-detail"><code>{event}</code></div>
    </details>
  );
}
