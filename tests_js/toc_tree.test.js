const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStandardTocNodes, tocNodeMaps } = require('../wandao_electron/renderer/toc_tree.js');

test('restores Aliyun parent_id hierarchy when a legacy manifest still points at ordered', () => {
  const provider = { id: 'aliyun', toc: { itemsPath: 'ordered', idKey: 'id', exportIdKey: 'id', titleKey: 'title', parentIdKey: 'parentId' } };
  const nodes = normalizeStandardTocNodes(provider, { nodes: [
    { id: 'folder', title: '资料', type: 'folder', parent_id: '' },
    { id: 'doc', title: '说明', type: 'document', parent_id: 'folder' }
  ] });
  const tree = tocNodeMaps(nodes);
  assert.deepEqual(tree.children.get('').map((node) => node.nodeId), ['aliyun:folder']);
  assert.deepEqual(tree.children.get('aliyun:folder').map((node) => node.nodeId), ['aliyun:doc']);
});

test('uses canonical Plugin v1 node fields when the manifest predates the normalized schema', () => {
  const provider = { id: 'ima-export', toc: { itemsPath: 'ordered', idKey: 'id', exportIdKey: 'id', titleKey: 'name', parentIdKey: 'parentId' } };
  const nodes = normalizeStandardTocNodes(provider, { nodes: [
    { nodeId: 'ima-kb:demo', exportId: '', title: '知识库', parentNodeId: '', selectable: false },
    { nodeId: 'ima-folder:demo:folder', exportId: '', title: '目录', parentNodeId: 'ima-kb:demo', selectable: false },
    { nodeId: 'ima-media:demo:doc', exportId: 'doc', title: '文档', parentNodeId: 'ima-folder:demo:folder', selectable: true }
  ] });
  const tree = tocNodeMaps(nodes);
  assert.deepEqual(tree.children.get('').map((node) => node.nodeId), ['ima-kb:demo']);
  assert.deepEqual(tree.children.get('ima-kb:demo').map((node) => node.nodeId), ['ima-folder:demo:folder']);
  assert.deepEqual(tree.children.get('ima-folder:demo:folder').map((node) => node.nodeId), ['ima-media:demo:doc']);
  assert.equal(nodes[2].selectable, true);
});

test('keeps provider-specific parent fields for Feishu and Yuque', () => {
  const feishu = normalizeStandardTocNodes({ id: 'feishu-export', toc: { itemsPath: 'ordered', idKey: 'wiki_token', exportIdKey: 'wiki_token', parentIdKey: 'parent_wiki_token' } }, { ordered: [
    { wiki_token: 'root', title: '根目录' }, { wiki_token: 'child', title: '子页', parent_wiki_token: 'root' }
  ] });
  const yuque = normalizeStandardTocNodes({ id: 'yuque', toc: { itemsPath: 'ordered', idKey: 'uuid', exportIdKey: 'uuid', parentIdKey: 'parent_uuid' } }, { ordered: [
    { uuid: 'folder', title: '目录' }, { uuid: 'doc', title: '文章', parent_uuid: 'folder' }
  ] });
  assert.equal(tocNodeMaps(feishu).children.get('feishu-export:root')[0].nodeId, 'feishu-export:child');
  assert.equal(tocNodeMaps(yuque).children.get('yuque:folder')[0].nodeId, 'yuque:doc');
});
