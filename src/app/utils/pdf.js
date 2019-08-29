import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function injectSignaturesIntoPDF(pdfFile, signaturesByPage) {
  const pdfBuffer = _base64ToArrayBuffer(pdfFile.split('base64,')[1]);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  for (let page of pages) {
    const index = pages.indexOf(page);
    const { width, height } = page.getSize();
    const signatures = signaturesByPage[index] || [];
    for (let sign of signatures) {
      if (!sign.signURL) {
        continue;
      }
      const imageBuffer = _base64ToArrayBuffer(
        sign.signURL.split('base64,')[1]
      );
      const image = await pdfDoc.embedPng(imageBuffer);
      const ratio = image.width / image.height;

      const imageWidth = sign.x2 - sign.x1;
      const resultHeight = (width * imageWidth) / 100 / ratio;

      page.drawImage(image, {
        x: (width * sign.x1) / 100,
        y: height * (100 - sign.y1) / 100 - resultHeight,
        width: (width * imageWidth) / 100,
        height: resultHeight
      });
    }
  }
  const pdfBytes = await pdfDoc.save();
  return 'data:application/pdf;base64,' + _arrayBufferToBase64(pdfBytes);
}
