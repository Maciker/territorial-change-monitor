interface Props {
  report: string;
  metadata: {
    beforeId: string;
    afterId: string;
    threshold: number;
    validCoverage: number;
    acquiredBefore: string;
    acquiredAfter: string;
  };
}

export function ReportPanel(props: Props) {
  return (
    <article>
      <h1>Change report</h1>
      <pre tabIndex={0}>{props.report}</pre>
      <p>
        Sources {props.metadata.beforeId} ({props.metadata.acquiredBefore}) and {props.metadata.afterId} (
        {props.metadata.acquiredAfter}). Threshold {props.metadata.threshold}. Coverage {props.metadata.validCoverage}.
      </p>
    </article>
  );
}
