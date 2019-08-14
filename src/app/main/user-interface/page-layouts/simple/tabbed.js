import React, {useState, useEffect, useRef} from 'react';
import {FusePageSimple, DemoContent} from '@fuse';

import {Tab, Tabs} from '@material-ui/core';
import {makeStyles} from '@material-ui/styles';
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
 
// import { Gas, defaultGasConfig } from 'dapparatus-core';

// let gas = new Gas();
// const WEB3_PROVIDER = 'http://localhost:8545';

// eslint-disable-next-line 
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

const useStyles = makeStyles({
    layoutRoot: {}
});



function SimpleTabbedSample()
{

    const classes = useStyles();
    let docEditor = useRef(null);
    let sigCanvas = useRef(null);
    const [selectedTab, setSelectedTab] = useState(0); 
    const [docContent, setDocContent] = useState(localStorage.getItem('docContent') || ''); 
    const [sigContent, setSigContent] = useState(localStorage.getItem('sigContent') || '');
    const [pdfContent, setPDFContent] = useState('');
    const [numPages, setNumPages] = useState(null); 
    const [pageNumber, setPageNumber] = useState(1); 
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

    const saveDocument = async (content) => {
      await setDocContent(content);
      // previewDoc();
    }

    const loadSignature = async () => {
      sigCanvas.fromDataURL(sigContent);
    }

    const saveSignature = async () => {      
      // console.log(sigCanvas.getTrimmedCanvas().toDataURL())
      setSigContent(await sigCanvas.getTrimmedCanvas().toDataURL());
    }
  
    const clearSignature = () => {
      sigCanvas.clear();
    }

    const previewDoc = async () => {

      const opt = {
        margin:       1,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
  
      window.html2pdf().from(document.getElementsByClassName('fr-view')[0]).set(opt)
        .from(document.getElementsByClassName('fr-view')[0]).toPdf().output('datauristring').then( (data) => {
        // console.log(data);
        setPDFContent(data);
      })
  
    }

    // getGasPrice();

    useEffect(() => {
      localStorage.setItem('docContent', docContent);
      localStorage.setItem('sigContent', sigContent);
      localStorage.setItem('pdfContent', pdfContent);
    });

    return (
        <FusePageSimple
            classes={{
                root   : classes.layoutRoot,
                toolbar: "px-16 sm:px-24"
            }}
            header={
                <div className="p-24"><h4>Document Creator</h4></div>
            }
            contentToolbar={
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="off"
                    className="w-full h-64 border-b-1">

                    <Tab className="h-64" label="Create Document"/>
                    <Tab className="h-64" label="Create Signature"/>
                    <Tab className="h-64" label="Document Preview"/>
                    <Tab className="h-64" label="Signing Editor"/>
                    <Tab className="h-64" label="Test Signing"/>
                    <Tab className="h-64" label="Item Six"/>
                    <Tab className="h-64" label="Item Seven"/>
                </Tabs>
            }
            content={
                <div className="p-24">
                    {selectedTab === 0 &&
                    (
                        <div>
                            <h3 className="mb-16">Create Document</h3>
                            <FroalaEditor
                              tag='textarea'
                              config={{
                                attribution: false,
                                autofocus: true,
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
                              ref={docEditor} />
                        </div>
                    )}
                    {selectedTab === 1 && (
                        <div>
                            <h3 className="mb-16">Create your signature</h3>
                            <div className='sigContainer'>
                            <SignatureCanvas penColor='black' maxWidth={1.5} canvasProps={{className: 'sigPad'}} 
                            ref={(ref) => { sigCanvas = ref }} />
                            </div>
                            <div className='sigFooter'>
                              <Button onClick={clearSignature} variant="contained" color="secondary">Clear</Button>
                              &nbsp;
                              <Button onClick={loadSignature} variant="contained" color="primary">Load</Button>
                              &nbsp;
                              <Button onClick={saveSignature} variant="contained" color="primary">Save</Button>
                            </div>
                        </div>
                    )}
                    {selectedTab === 2 && (

                          <div>
                            <h3 className="mb-16">Assign signature and initial points</h3>
                            <div style={{visibility: 'hidden', height: '0'}}>
                            <FroalaEditorView
                              model={docContent} />
                            </div>

                            <Button onClick={previewDoc} variant="contained" color="primary">Preview PDF</Button>
                            <br /><br />
                            <div className="PDFPreview">
                            <div className="PDFPreview__container">
                            <div className="PDFPreview__container__document">
                              <Document
                                file={pdfContent}
                                onLoadSuccess={({numPages}) => setNumPages(numPages)}
                                >
                                <Page pageNumber={pageNumber}/>
                              </Document>
                              <p>Page {pageNumber} of {numPages}</p>
                            </div>
                            </div>
                            </div>                            
                            <Button variant="contained" color="primary" 
                              onClick={() => setPageNumber(pageNumber - 1)}>
                              Previous page
                            </Button>
                            &nbsp;
                            <Button variant="contained" color="primary" 
                              onClick={() => setPageNumber(pageNumber + 1)}>
                              Next page
                            </Button>                            
                            
                        </div>
                    )}
                    {selectedTab === 3 && (
                        <div>
                            <h3 className="mb-16">Test document signing</h3>
                            TODO
                        </div>
                    )}
                    {selectedTab === 4 && (
                        <div>
                            <h3 className="mb-16">Item Five</h3>
                            TODO
                        </div>
                    )}
                    {selectedTab === 5 && (
                        <div>
                            <h3 className="mb-16">Item Six</h3>
                            TODO
                        </div>
                    )}
                    {selectedTab === 6 && (
                        <div>
                            <h3 className="mb-16">Item Seven</h3>
                            <DemoContent/>
                        </div>
                    )}
                </div>
            }
        />
    )
}

export default SimpleTabbedSample;
