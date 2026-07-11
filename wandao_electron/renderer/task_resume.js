(function (root) {
  function isInterruptedTask(task) {
    const status = String(task?.status || '').toLowerCase();
    return status === 'stopped' || status === 'interrupted';
  }

  function buildResumeArgs(task, retryArg, failureCount = 0) {
    const args = Array.isArray(task?.args) ? [...task.args] : [];
    if (isInterruptedTask(task)) return args.filter((arg) => arg !== retryArg);
    if (!retryArg || !Number.isFinite(Number(failureCount)) || Number(failureCount) <= 0) return args;
    if (!args.includes(retryArg)) args.push(retryArg);
    return args;
  }

  function shouldRetryFailureItems(task, retryArg, failureCount = 0) {
    return Boolean(retryArg && !isInterruptedTask(task) && Number(failureCount) > 0);
  }

  const api = { buildResumeArgs, isInterruptedTask, shouldRetryFailureItems };
  root.WandaoTaskResume = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
