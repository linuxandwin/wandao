(function (root) {
  function firstNonEmpty(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
    }
    return '';
  }

  function compact(value, limit = 700) {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return String(text || '').replace(/\s+/g, ' ').trim().slice(0, limit);
  }

  function numberValue(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number) && number > 0) return number;
    }
    return 0;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function describeFailureItem(item, parent = '') {
    if (!item || typeof item !== 'object') return compact(item);
    const subject = firstNonEmpty(
      item.relativePath,
      item.document,
      item.title,
      item.path,
      item.id,
      item.docId,
      item.nodeId,
      item.url,
      item.target,
      item.file,
      item.resource
    );
    const reason = firstNonEmpty(item.error, item.reason, item.message, item.status, item.code);
    const prefix = [parent, subject].filter(Boolean).join(' / ');
    if (prefix && reason) return `${prefix}：${reason}`;
    return prefix || reason || compact(item);
  }

  function collectFailureItems(data, limit = 100) {
    const items = [];
    const visit = (value, source = '') => {
      if (!value || items.length >= limit) return;
      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, source));
        return;
      }
      if (typeof value !== 'object') return;
      const looksLikeFailure = value.error || value.reason || value.message || value.relativePath || value.url || value.title;
      if (looksLikeFailure) items.push({ source, ...value });
      Object.entries(value).forEach(([key, child]) => {
        if (/fail|error|warning/i.test(key)) visit(child, key);
      });
    };
    if (data && typeof data === 'object') {
      ['failures', 'resourceFailures', 'imageFailures', 'attachmentFailures', 'resourceWarnings', 'errors'].forEach((key) => {
        visit(data[key], key);
      });
    }
    return items;
  }

  function normalizeTaskReport(data, options = {}) {
    const source = data && typeof data === 'object' ? data : {};
    const failureItems = collectFailureItems(source);
    const resourceFailures = asArray(source.resourceFailures);
    const stats = {
      total: numberValue(source.totalDocs, source.total, source.selectedDocs, source.docCount, source.fileCount, source.totalFiles),
      success: numberValue(source.successCount, source.successfulDocs, source.successfulFiles),
      exported: numberValue(source.exportedDocs, source.exported, source.exportCount),
      imported: numberValue(source.importedDocs, source.imported, source.importCount),
      created: numberValue(source.createdDocs, source.created, source.createdCount),
      updated: numberValue(source.updatedDocs, source.updated, source.updatedCount),
      skipped: numberValue(source.skippedDocs, source.skipped, source.skippedCount),
      failed: numberValue(source.failureCount, source.failedDocs, source.failed, source.errorCount),
      imageSuccess: numberValue(source.imageSuccess, source.imageUploads, source.imageUploadsCount),
      imageFailed: numberValue(source.imageFailureCount, asArray(source.imageFailures).length),
      attachmentSuccess: numberValue(source.attachmentSuccess, source.attachmentUploads),
      attachmentFailed: numberValue(source.attachmentFailureCount, asArray(source.attachmentFailures).length),
      resourceFailed: numberValue(source.resourceFailureCount, resourceFailures.length)
    };
    if (!stats.success) stats.success = stats.exported || stats.imported || stats.created + stats.updated;
    if (!stats.failed && failureItems.length) stats.failed = failureItems.length;
    if (!stats.failed && options.errorText) stats.failed = 1;
    return {
      schemaVersion: 1,
      provider: firstNonEmpty(source.provider, source.platform, options.provider),
      mode: firstNonEmpty(source.mode, options.mode),
      output: firstNonEmpty(source.output, source.outputDir),
      reportFile: firstNonEmpty(source.reportFile),
      stopped: Boolean(source.stopped),
      stats,
      failures: failureItems,
      raw: source
    };
  }

  function summarizeStats(stats = {}, errorText = '') {
    const parts = [];
    if (stats.total) parts.push(`总数 ${stats.total}`);
    if (stats.exported) parts.push(`导出 ${stats.exported}`);
    if (stats.imported) parts.push(`导入 ${stats.imported}`);
    if (stats.created) parts.push(`创建 ${stats.created}`);
    if (stats.updated) parts.push(`更新 ${stats.updated}`);
    if (stats.skipped) parts.push(`跳过 ${stats.skipped}`);
    if (stats.imageSuccess) parts.push(`图片 ${stats.imageSuccess}`);
    if (stats.attachmentSuccess) parts.push(`附件 ${stats.attachmentSuccess}`);
    if (stats.failed) parts.push(`失败 ${stats.failed}`);
    if (!parts.length && errorText) parts.push(compact(errorText, 120));
    return parts.join('，') || '暂无统计信息';
  }

  function collectFailureDiagnostics(data, limit = 80) {
    const lines = [];
    const report = normalizeTaskReport(data);
    const pushLine = (label, text) => {
      const content = compact(text, 700);
      if (!content || lines.length >= limit) return;
      lines.push(`${label}：${content}`);
    };
    report.failures.forEach((item, index) => {
      if (lines.length >= limit) return;
      const current = describeFailureItem(item);
      if (current) pushLine(`失败项 #${index + 1}`, current);
      if (Array.isArray(item.failures)) {
        const parent = firstNonEmpty(item.document, item.relativePath, item.title, item.path);
        item.failures.forEach((child, childIndex) => {
          if (lines.length >= limit) return;
          pushLine(`失败项 #${index + 1}.${childIndex + 1}`, describeFailureItem(child, parent));
        });
      }
    });
    if (report.stats.failed > 0 && !lines.length) {
      pushLine('失败统计', `failureCount=${report.stats.failed}，脚本没有返回逐项失败原因，请查看 Python 原始日志。`);
    }
    if (report.stats.imageFailed > 0 && !lines.some((line) => line.includes('图片'))) {
      pushLine('图片失败统计', `imageFailureCount=${report.stats.imageFailed}，脚本没有返回逐项图片失败原因。`);
    }
    if (lines.length >= limit) {
      lines.push(`还有更多失败项未展示，请打开报告文件查看完整内容：${report.reportFile || report.output || ''}`.trim());
    }
    return lines;
  }

  function statusText(status) {
    const map = {
      running: '进行中',
      completed: '已完成',
      failed: '失败',
      stopped: '已停止'
    };
    return map[status] || status || '未知';
  }

  function formatDuration(ms) {
    const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes} 分 ${rest} 秒`;
  }

  function maskArgs(args) {
    const sensitiveKeys = new Set([
      '--password',
      '--password-stdin',
      '--app-secret',
      '--api-key',
      '--client-secret',
      '--token',
      '--cookie'
    ]);
    const masked = [];
    for (let index = 0; index < (args || []).length; index += 1) {
      const value = String(args[index]);
      masked.push(value);
      if (sensitiveKeys.has(value) && index + 1 < args.length) {
        masked.push('***');
        index += 1;
      }
    }
    return masked;
  }

  function createMarkdownTaskReport(task, options = {}) {
    const provider = options.provider || {};
    const maskSensitiveText = options.maskSensitiveText || ((text) => text);
    const normalizedReport = task.report || normalizeTaskReport(task.resultData, {
      errorText: task.error,
      provider: task.providerId,
      mode: task.action
    });
    const failureItems = normalizedReport?.failures || task.stats?.failureItems || [];
    const structuredEvents = (task.logs || [])
      .filter((entry) => entry.event || entry.data)
      .map((entry) => ({
        time: entry.time,
        source: entry.source,
        type: entry.type,
        event: entry.event,
        message: entry.message,
        data: entry.data
      }));
    return maskSensitiveText([
      '# 万能导任务报告',
      '',
      `任务 ID：${task.id}`,
      `平台：${task.providerTitle || provider.title || task.providerId || '-'}`,
      `任务：${task.title || '-'}`,
      `状态：${statusText(task.status)}`,
      `开始时间：${task.startedAt || '-'}`,
      `结束时间：${task.finishedAt || '-'}`,
      task.elapsedMs ? `耗时：${formatDuration(task.elapsedMs)}` : '',
      `脚本：${task.script || '-'}`,
      `参数：${JSON.stringify(maskArgs(task.args || []))}`,
      '',
      '## 统计',
      summarizeStats(normalizedReport?.stats || task.stats || {}, task.error),
      normalizedReport?.reportFile ? `报告文件：${normalizedReport.reportFile}` : '',
      normalizedReport?.output ? `输出目录：${normalizedReport.output}` : '',
      '',
      '## 错误',
      task.error || '无',
      '',
      '## 失败项',
      failureItems.length ? JSON.stringify(failureItems, null, 2) : '无',
      '',
      '## 结构化事件',
      structuredEvents.length ? JSON.stringify(structuredEvents, null, 2) : '无',
      '',
      '## 结果数据',
      task.resultData ? JSON.stringify(task.resultData, null, 2) : '无',
      '',
      '## 本任务详细日志',
      task.logs?.length ? task.logs.map((entry) => {
        const event = entry.event ? ` [${entry.event}]` : '';
        return `[${entry.time}] [${entry.source}] [${entry.type}]${event} ${entry.message}`;
      }).join('\n') : '无'
    ].filter((line) => line !== '').join('\n'));
  }

  function taskArtifactPaths(task) {
    const report = task.report || normalizeTaskReport(task.resultData, {
      errorText: task.error,
      provider: task.providerId,
      mode: task.action
    });
    return {
      output: firstNonEmpty(report?.output, task.resultData?.output, task.resultData?.outputDir),
      reportFile: firstNonEmpty(report?.reportFile, task.resultData?.reportFile)
    };
  }

  function taskFailurePreview(task, limit = 3) {
    const source = task.report?.raw || task.resultData || task.report || {};
    const lines = collectFailureDiagnostics(source, Math.max(1, limit));
    if (lines.length) return lines.slice(0, limit);
    if (task.error) return [compact(task.error, 260)];
    return [];
  }

  const api = {
    normalizeTaskReport,
    summarizeStats,
    collectFailureDiagnostics,
    collectFailureItems,
    describeFailureItem,
    statusText,
    formatDuration,
    maskArgs,
    createMarkdownTaskReport,
    taskArtifactPaths,
    taskFailurePreview
  };

  root.WandaoTaskReport = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
