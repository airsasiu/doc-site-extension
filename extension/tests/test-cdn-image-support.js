const fs = require('fs');
const path = require('path');
const vm = require('vm');

const extensionRoot = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, 'manifest.json'), 'utf8'));
const processorSource = fs.readFileSync(
  path.join(extensionRoot, 'scripts', 'markdown-link-processor.js'),
  'utf8'
);
const backgroundSource = fs.readFileSync(path.join(extensionRoot, 'background.js'), 'utf8');
const remoteImageUrl =
  'https://cdn.example.com/document-site-files/images/b2223940-43c2-44cf-8eda-f5ab9acd84f0/image-20260714.e8e6b2.png?width=400';
const placeholderDocSiteImageUrl =
  'https://docapp.example.com/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/images/b2223940-43c2-44cf-8eda-f5ab9acd84f0/image-20260707.f11ed1.png?width=600';
const mesciusGifUrl =
  'https://cdn.mescius.io/document-site-files/images/b2223940-43c2-44cf-8eda-f5ab9acd84f0/dragFill-20260630.9dc776.gif?width=400';
const mesciusPngUrl =
  'https://cdn.mescius.io/document-site-files/images/b2223940-43c2-44cf-8eda-f5ab9acd84f0/image-20260722.6c6267.png?width=400';

function getFilenameFromUrl(url) {
  return new URL(url).pathname.split('/').pop();
}

function getMimeTypeFromUrl(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.gif')) return 'image/gif';
  return pathname.endsWith('.png') ? 'image/png' : 'application/octet-stream';
}

function extractFunction(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  if (start === -1) {
    throw new Error(`Function ${functionName} not found`);
  }

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }

  throw new Error(`Function ${functionName} body not found`);
}

const uploadResponseContext = {
  console,
  URL,
  window: { location: { href: 'https://docapp.example.com/manage/ArticleEdit/product' } }
};
vm.runInNewContext(
  [
    'isImageAlreadyProcessed',
    'isPlaceholderDocumentSiteImageUrl',
    'isUploadedImageUrl',
    'findUploadedImageUrl',
    'parseUploadResponse',
    'convertDocumentSiteFileUrlToInternal'
  ].map(name => extractFunction(processorSource, name)).join('\n'),
  uploadResponseContext
);

const permissionContext = { console, URL };
vm.runInNewContext(
  [
    'getImageOriginsFromMarkdown',
    'resolveImageUrlForPermission',
    'getOriginFromUrl'
  ].map(name => extractFunction(backgroundSource, name)).join('\n'),
  permissionContext
);

if (!manifest.optional_host_permissions.includes('https://*/*')) {
  throw new Error('manifest.json must allow requesting optional HTTPS host permissions');
}

if (manifest.host_permissions.some(permission => /mescius\.io/.test(permission))) {
  throw new Error('manifest.json should not hard-code Mescius image host permissions');
}

if (!backgroundSource.includes('requestImageHostPermissions')) {
  throw new Error('Image upload commands must request permissions for selected image origins');
}

const sameOriginMarkdown = `![image](${placeholderDocSiteImageUrl})`;
const sameOriginOrigins = permissionContext.getImageOriginsFromMarkdown(
  sameOriginMarkdown,
  'https://docapp.example.com/editor/page'
);
if (!sameOriginOrigins.includes('https://docapp.example.com/*')) {
  throw new Error('Same-origin docapp images must still request host permission for background fetch');
}

if (getFilenameFromUrl(remoteImageUrl) !== 'image-20260714.e8e6b2.png') {
  throw new Error('Remote image filename must exclude query parameters');
}

if (getMimeTypeFromUrl(remoteImageUrl) !== 'image/png') {
  throw new Error('Remote image MIME type must be determined from the URL pathname');
}

if (getFilenameFromUrl(mesciusGifUrl) !== 'dragFill-20260630.9dc776.gif') {
  throw new Error('Mescius CDN image filename must exclude query parameters');
}

if (getMimeTypeFromUrl(mesciusGifUrl) !== 'image/gif') {
  throw new Error('Mescius CDN GIF MIME type must be determined from the URL pathname');
}

if (getFilenameFromUrl(mesciusPngUrl) !== 'image-20260722.6c6267.png') {
  throw new Error('Mescius CDN PNG filename must exclude query parameters');
}

if (getMimeTypeFromUrl(mesciusPngUrl) !== 'image/png') {
  throw new Error('Mescius CDN PNG MIME type must be determined from the URL pathname');
}

const gifMarkdown = `![demo.gif](${mesciusGifUrl})`;
const gifOrigins = permissionContext.getImageOriginsFromMarkdown(gifMarkdown, 'https://docapp.example.com/editor');
if (!Array.isArray(gifOrigins) || gifOrigins[0] !== 'https://cdn.mescius.io/*') {
  throw new Error('GIF markdown must be recognized as an image link for host permission collection');
}

if (uploadResponseContext.isImageAlreadyProcessed(mesciusPngUrl)) {
  throw new Error('Mescius CDN document-site-files URLs must not be treated as already processed');
}

const placeholderInternalImageUrl = '/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/images/5fefd5d8-238b-4c13-893b-6f22fcc5b9dd/pt-ts-reference.50549c.png';
if (!uploadResponseContext.isImageAlreadyProcessed(placeholderInternalImageUrl)) {
  throw new Error('Placeholder document-site image URLs must be treated as already processed');
}

const convertedPlaceholderImageUrl = uploadResponseContext.convertDocumentSiteFileUrlToInternal(placeholderInternalImageUrl);
if (convertedPlaceholderImageUrl !== placeholderInternalImageUrl) {
  throw new Error('Placeholder document-site image URLs must remain unchanged');
}

if (!processorSource.includes('new URL(url).pathname')) {
  throw new Error('Image URL helpers must use URL.pathname when parsing filenames and MIME types');
}

if (/url\.includes\(['"]\/DOCUMENT_SITE_LINK_PREFIX_HERE\/document-site-files\/['"]\)/.test(processorSource)) {
  throw new Error('Placeholder document-site image URLs must not be treated as already processed');
}

if (getFilenameFromUrl(placeholderDocSiteImageUrl) !== 'image-20260707.f11ed1.png') {
  throw new Error('Placeholder document-site image filename must exclude query parameters');
}

const jsonStringUploadResponse = '"/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/images/root/dragFill.gif"';
if (uploadResponseContext.parseUploadResponse(jsonStringUploadResponse) !== '/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/images/root/dragFill.gif') {
  throw new Error('Upload response parser must support JSON string URL responses');
}

const nestedUploadResponse = '{"data":{"fileUrl":"/document-site-files/images/root/resize.gif"}}';
if (uploadResponseContext.parseUploadResponse(nestedUploadResponse) !== '/document-site-files/images/root/resize.gif') {
  throw new Error('Upload response parser must support nested URL responses');
}

console.log('Remote image support test passed.');
