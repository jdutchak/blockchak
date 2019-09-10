import React, { useState, useEffect, useRef } from 'react';
import { FusePageSimple, DemoContent } from '@fuse';

import { Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';

import FroalaEditor from 'react-froala-wysiwyg';
import FroalaEditorView from 'react-froala-wysiwyg/FroalaEditorView';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.css';
import 'froala-editor/js/plugins.pkgd.min.js';
import 'font-awesome/css/font-awesome.css';

import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';

import SignatureCanvas from 'react-signature-canvas';

import { injectSignaturesIntoPDF } from '../../../../utils/pdf';

// import { Gas, defaultGasConfig } from 'dapparatus-core';

// let gas = new Gas();
// const WEB3_PROVIDER = 'http://localhost:8545';

// eslint-disable-next-line
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const useStyles = makeStyles({
  layoutRoot: {}
});

function lim(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// component that represent a signature place
// you can drag it, delete it or sign it (with popup);
let justDragged = false; // this saved as variable for performance reasons
function SignPlace({
  place,
  updatePlace,
  canSign,
  canMove,
  onDragEnd,
  onSignFinish,
  onRemove
}) {
  const ref = React.useRef();
  const sigCanvasRef = React.useRef();
  const [isSigning, setIsSigning] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState();

  React.useEffect(() => {
    if (!canMove) {
      return;
    }
    if (!isDragging) {
      return;
    }
    const onMove = e => {
      justDragged = true;
      const parent = ref.current.parentElement;
      const box = parent.getBoundingClientRect();

      const width = place.x2 - place.x1;
      const height = place.y2 - place.y1;

      const minX1 = 0;
      const maxX1 = 100 - width;

      const minX2 = width;
      const maxX2 = 100;

      const minY1 = 0;
      const maxY1 = 100 - height;

      const minY2 = height;
      const maxY2 = 100;

      const updatedPlace = {
        ...place,
        x1: lim(
          ((e.clientX - dragOffset.x1 - box.left) / box.width) * 100,
          minX1,
          maxX1
        ),
        y1: lim(
          ((e.clientY - dragOffset.y1 - box.top) / box.height) * 100,
          minY1,
          maxY1
        ),
        x2: lim(
          ((e.clientX - dragOffset.x2 - box.left) / box.width) * 100,
          minX2,
          maxX2
        ),
        y2: lim(
          ((e.clientY - dragOffset.y2 - box.top) / box.height) * 100,
          minY2,
          maxY2
        )
      };

      updatePlace(updatedPlace);
    };

    const onUp = () => {
      setIsDragging(false);
      onDragEnd();
      setTimeout(() => {
        justDragged = false;
      }, 50);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);
  return (
    <React.Fragment>
      <div
        className="sign-place"
        ref={ref}
        onMouseDown={e => {
          justDragged = false;
          if (!canMove) {
            return;
          }

          setIsDragging(true);
          const box = e.currentTarget.getBoundingClientRect();
          const offset = {
            x1: e.clientX - box.left,
            y1: e.clientY - box.top,
            x2: e.clientX - (box.left + box.width),
            y2: e.clientY - (box.top + box.height)
          };
          setDragOffset(offset);
        }}
        onClick={() => {
          if (canSign && !justDragged) {
            setIsSigning(true);
          }
          if (!canSign && !justDragged) {
            const placeholder =
              place.placeholder === 'Sign here' ? 'Initials here' : 'Sign here';
            updatePlace({
              ...place,
              placeholder
            });
          }
        }}
        style={{
          left: Math.min(place.x1, place.x2) + '%',
          top: Math.min(place.y1, place.y2) + '%',
          width: Math.abs(place.x1 - place.x2) + '%',
          height: Math.abs(place.y1 - place.y2) + '%',
          backgroundImage: `url(${place.signURL})`
        }}
      >
        {canMove && (
          <div className="remove-button" onClick={onRemove}>
            x
          </div>
        )}
        {place.placeholder || 'Sign here'}
      </div>
      {isSigning && (
        <React.Fragment>
          <div className="sign-overlay" />
          <div className="sign-wrap">
            <div
              className="sign-container"
              style={{
                paddingBottom:
                  (Math.abs(place.y1 - place.y2) /
                    Math.abs(place.x1 - place.x2)) *
                    100 +
                  '%'
              }}
            >
              <div className="sign-inner">
                <SignatureCanvas
                  penColor="black"
                  maxWidth={1.5}
                  canvasProps={{ className: 'sigPad' }}
                  ref={sigCanvasRef}
                />
              </div>
            </div>
            <div className="sigFooter">
              <Button
                onClick={() => {
                  setIsSigning(false);
                }}
                variant="contained"
                color="secondary"
              >
                Cancel
              </Button>
              &nbsp;
              <Button
                onClick={() => {
                  sigCanvasRef.current.clear();
                }}
                variant="contained"
                color="secondary"
              >
                Clear
              </Button>
              &nbsp;
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setIsSigning(false);
                  const url = sigCanvasRef.current.getCanvas().toDataURL();

                  updatePlace({
                    signURL: url
                  });
                  onSignFinish({
                    ...place,
                    signURL: url
                  });
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

// Component for showing and creating a list of signatures
function SignaturePlacer({
  signatures,
  updateSignatures,
  // use this flag when we can't create new signatures
  // only sign the document
  signOnly,
  onSignFinish
}) {
  const [drawing, setDrawing] = React.useState(false);
  const [signPlaces, setSignPlaces] = React.useState([]);

  // load initial data
  // we will use local "signPlaces" for performance reasons
  React.useEffect(() => {
    // we need to overwrite local version as soon as we have a new update
    setSignPlaces(signatures);
  }, [signatures]);

  return (
    <div
      className="signature-placer"
      onMouseDown={e => {
        if (e.target !== e.currentTarget) {
          return;
        }
        if (signOnly) {
          return;
        }
        setDrawing(true);
        const box = e.currentTarget.getBoundingClientRect();

        const place = {
          x1: ((e.clientX - box.left) / box.width) * 100,
          y1: ((e.clientY - box.top) / box.height) * 100,
          x2: ((e.clientX - box.left) / box.width) * 100,
          y2: ((e.clientY - box.top) / box.height) * 100
        };
        setSignPlaces(signPlaces.concat([place]));
      }}
      onMouseMove={e => {
        if (!drawing) {
          return;
        }
        const box = e.currentTarget.getBoundingClientRect();
        const lastPlace = signPlaces[signPlaces.length - 1];

        lastPlace.x2 = ((e.clientX - box.left) / box.width) * 100;
        lastPlace.y2 = ((e.clientY - box.top) / box.height) * 100;

        setSignPlaces(
          signPlaces.slice(0, signPlaces.length - 1).concat([lastPlace])
        );
      }}
      onMouseUp={e => {
        if (!drawing) {
          return;
        }
        setDrawing(false);

        const lastPlace = signPlaces[signPlaces.length - 1];
        const width = Math.abs(lastPlace.x2 - lastPlace.x1);
        const height = Math.abs(lastPlace.y2 - lastPlace.y1);

        const tooSmall = width < 2 || height < 2;

        if (tooSmall) {
          // remove last
          setSignPlaces(signPlaces.slice(0, signPlaces.length - 1));
        } else {
          updateSignatures(signPlaces.slice());
        }
      }}
    >
      {signPlaces.map((place, i) => {
        return (
          <SignPlace
            key={i}
            place={place}
            updatePlace={newPlace => {
              signPlaces.splice(i, 1, newPlace);
              setSignPlaces(signPlaces.slice());
            }}
            onDragEnd={() => {
              updateSignatures(signPlaces);
            }}
            canSign={signOnly}
            canMove={!signOnly}
            onSignFinish={newPlace => {
              signPlaces.splice(i, 1, newPlace);
              updateSignatures(signPlaces.slice());
              onSignFinish();
            }}
            onRemove={() => {
              signPlaces.splice(i, 1);
              updateSignatures(signPlaces.slice());
            }}
          />
        );
      })}
    </div>
  );
}

function SimpleTabbedSample() {
  const classes = useStyles();
  let docEditor = useRef(null);
  let sigCanvas = useRef(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [docContent, setDocContent] = useState(
    localStorage.getItem('docContent') || ''
  );
  const [sigContent, setSigContent] = useState(
    localStorage.getItem('sigContent') || ''
  );
  const [pdfContent, setPDFContent] = useState('');

  const [resultContent, setResultPDFContent] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [signaturesByPage, setSignatures] = useState({});

  const pdfContainerRef = React.useRef();
  const [pdfSize, setPdfSize] = useState(1000);

  React.useEffect(() => {
    if (!pdfContainerRef.current) {
      return;
    }
    if (pdfContainerRef.current.offsetWidth !== pdfSize) {
      setPdfSize(pdfContainerRef.current.offsetWidth);
    }
  });

  // const [gasPrice, setGasPrice] = useState(0);

  const handleTabChange = (event, value) => {
    setSelectedTab(value);
  };

  // console.log('docContent', docContent);
  // console.log('sigContent', sigContent);
  // console.log('docEditor', docEditor);

  // console.log(docEditor);
  // console.log('gasPrice', gasPrice);

  // const getGasPrice = async () => {
  //   setGasPrice(await gas.checkGasPrices());
  // }

  const saveDocument = async content => {
    await setDocContent(content);
    // previewDoc();
  };

  const loadSignature = async () => {
    sigCanvas.fromDataURL(sigContent);
  };

  const saveSignature = async () => {
    // console.log(sigCanvas.getTrimmedCanvas().toDataURL())
    setSigContent(await sigCanvas.getTrimmedCanvas().toDataURL());
  };

  const clearSignature = () => {
    sigCanvas.clear();
  };

  const previewDoc = async () => {
    const opt = {
      margin: 1,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    window
      .html2pdf()
      .set(opt)
      .from(document.getElementsByClassName('fr-view')[0])
      .toPdf()
      .output('datauristring')
      .then(data => {
        // console.log(data);
        setPDFContent(data);
      });
  };

  const previewSignDocument = async () => {
    const newDoc = await injectSignaturesIntoPDF(pdfContent, signaturesByPage);
    setResultPDFContent(newDoc);
  };

  // getGasPrice();

  useEffect(() => {
    localStorage.setItem('docContent', docContent);
    localStorage.setItem('sigContent', sigContent);
    localStorage.setItem('pdfContent', pdfContent);
  });

  return (
    <FusePageSimple
      classes={{
        root: classes.layoutRoot,
        toolbar: 'px-16 sm:px-24'
      }}
      header={
        <div className="p-24">
          <h4>Document Creator</h4>
        </div>
      }
      contentToolbar={
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="off"
          className="w-full h-64 border-b-1"
        >
          <Tab className="h-64" label="Create Document" />
          {/* <Tab className="h-64" label="Create Signature" /> */}
          {/* <Tab className="h-64" label="Document Preview" /> */}
          <Tab className="h-64" label="Signing Editor" />
          <Tab className="h-64" label="Test Signing" />

          <Tab className="h-64" label="Finished Preview" />
          {/* <Tab className="h-64" label="Item Six" /> */}
          {/* <Tab className="h-64" label="Item Seven" /> */}
        </Tabs>
      }
      content={
        <div className="p-24">
          {selectedTab === 0 && (
            <div>
              <h3 className="mb-16">Create Document</h3>
              <FroalaEditor
                config={{
                  attribution: false,
                  autofocus: true
                  // events: {
                  //   'commands.mousedown': function (btn) {
                  //     // Do something here.
                  //     // this is the editor instance.
                  //     // console.log(btn);
                  //   },
                  //   'focus' : function(e, editor) {
                  //     console.log(e, editor);
                  //   }
                  // }
                }}
                model={docContent}
                onModelChange={saveDocument}
                ref={docEditor}
              />
            </div>
          )}
          {/* {selectedTab === 1 && (
            <div>
              <h3 className="mb-16">Create your signature</h3>
              <div className="sigContainer">
                <SignatureCanvas
                  penColor="black"
                  maxWidth={1.5}
                  canvasProps={{ className: 'sigPad' }}
                  ref={ref => {
                    sigCanvas = ref;
                  }}
                />
              </div>
              <div className="sigFooter">
                <Button
                  onClick={clearSignature}
                  variant="contained"
                  color="secondary"
                >
                  Clear
                </Button>
                &nbsp;
                <Button
                  onClick={loadSignature}
                  variant="contained"
                  color="primary"
                >
                  Load
                </Button>
                &nbsp;
                <Button
                  onClick={saveSignature}
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
              </div>
            </div>
          )} */}
          {selectedTab === 1 && (
            <div>
              <h3 className="mb-16">Assign signature and initial points</h3>
              <div style={{ visibility: 'hidden', height: '0' }}>
                <FroalaEditorView model={docContent} />
              </div>
              <Button onClick={previewDoc} variant="contained" color="primary">
                Preview PDF
              </Button>
              <br />
              <br />
              <div className="PDFPreview" ref={pdfContainerRef}>
                <div className="PDFPreview__container">
                  <div className="PDFPreview__container__document">
                    <Document
                      file={pdfContent}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    >
                      <Page pageNumber={pageNumber} width={pdfSize} />
                    </Document>
                    <SignaturePlacer
                      signatures={signaturesByPage[pageNumber - 1] || []}
                      updateSignatures={signatures => {
                        setSignatures({
                          ...signaturesByPage,
                          [pageNumber - 1]: signatures
                        });
                      }}
                    />
                    {numPages && (
                      <p>
                        Page {pageNumber} of {numPages}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setPageNumber(Math.max(0, pageNumber - 1))}
              >
                Previous page
              </Button>
              &nbsp;
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  setPageNumber(Math.min(numPages, pageNumber + 1))
                }
              >
                Next page
              </Button>
            </div>
          )}
          {selectedTab === 2 && (
            <div>
              <h3 className="mb-16">Try signing the doc</h3>
              <div style={{ visibility: 'hidden', height: '0' }}>
                <FroalaEditorView model={docContent} />
              </div>
              <Button onClick={previewDoc} variant="contained" color="primary">
                Preview PDF
              </Button>
              <br />
              <br />
              <div className="PDFPreview" ref={pdfContainerRef}>
                <div className="PDFPreview__container">
                  <div className="PDFPreview__container__document">
                    <Document
                      file={pdfContent}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    >
                      <Page pageNumber={pageNumber} width={pdfSize} />
                    </Document>
                    <SignaturePlacer
                      signatures={signaturesByPage[pageNumber - 1] || []}
                      updateSignatures={signatures => {
                        setSignatures({
                          ...signaturesByPage,
                          [pageNumber - 1]: signatures
                        });
                      }}
                      signOnly
                      onSignFinish={previewSignDocument}
                    />
                    <p>
                      Page {pageNumber} of {numPages}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setPageNumber(Math.max(0, pageNumber - 1))}
              >
                Previous page
              </Button>
              &nbsp;
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  setPageNumber(Math.min(numPages, pageNumber + 1))
                }
              >
                Next page
              </Button>
            </div>
          )}
          {selectedTab === 3 && (
            <div>
              <h3 className="mb-16">Result preview</h3>
              <br />
              <br />
              <div className="PDFPreview">
                <div className="PDFPreview__container">
                  <div className="PDFPreview__container__document">
                    <Document
                      file={resultContent}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    >
                      <Page pageNumber={pageNumber} />
                    </Document>
                    <p>
                      Page {pageNumber} of {numPages}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setPageNumber(Math.max(0, pageNumber - 1))}
              >
                Previous page
              </Button>
              &nbsp;
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  setPageNumber(Math.min(numPages, pageNumber + 1))
                }
              >
                Next page
              </Button>
            </div>
          )}
        </div>
      }
    />
  );
}

export default SimpleTabbedSample;
