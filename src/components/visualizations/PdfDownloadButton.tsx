import React, { useRef, CSSProperties, ReactNode } from 'react';
import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';

/**
 * Options pour la configuration du PDF
 */
interface PDFOptions {
  margin?: number;
  filename?: string;
  image?: {
    type?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  };
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    letterRendering?: boolean;
  };
  jsPDF?: {
    unit?: string;
    format?: string;
    orientation?: 'portrait' | 'landscape';
  };
}

/**
 * Props du composant PDFDownloadButton
 */
interface PDFDownloadButtonProps {
  /** Contenu HTML à convertir en PDF (Mode HTML→PDF) */
  children?: ReactNode;
  
  /** Fonction pour générer le PDF programmatiquement (Mode Code→PDF) */
  generateContent?: (doc: jsPDF) => void | Promise<void>;
  
  /** Nom du fichier PDF (sans extension) */
  filename?: string;
  
  /** Texte affiché sur le bouton */
  buttonText?: string;
  
  /** Styles CSS personnalisés pour le bouton */
  buttonStyle?: CSSProperties;
  
  /** Classes CSS pour le bouton */
  className?: string;
  
  /** Options de configuration pour html2pdf */
  pdfOptions?: PDFOptions;
  
  /** Callback appelé après génération réussie */
  onSuccess?: () => void;
  
  /** Callback appelé en cas d'erreur */
  onError?: (error: Error) => void;
}

/**
 * Composant flexible pour télécharger du contenu en PDF
 * Supporte 2 modes :
 * 1. HTML → PDF : Convertit du contenu React/HTML existant
 * 2. Code → PDF : Génère le PDF programmatiquement avec jsPDF
 */
const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  // Mode HTML → PDF
  children,
  
  // Mode Code → PDF
  generateContent,
  
  // Commun
  filename = 'document',
  buttonText = 'Download PDF',
  buttonStyle = {},
  className = '',
  pdfOptions = {},
  onSuccess,
  onError
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Mode 1 : HTML → PDF (avec html2pdf)
  const handleHTMLToPDF = async (): Promise<void> => {
    if (!contentRef.current) {
      throw new Error('No HTML content to convert');
    }

    const defaultOptions: PDFOptions = {
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      ...pdfOptions
    };

    await html2pdf()
      .set(defaultOptions)
      .from(contentRef.current)
      .save();
  };

  // Mode 2 : Code → PDF (avec jsPDF)
  const handleCodeToPDF = async (): Promise<void> => {
    if (typeof generateContent !== 'function') {
      throw new Error('generateContent must be a function');
    }

    const doc = new jsPDF();
    await generateContent(doc);
    doc.save(`${filename}.pdf`);
  };

  // Handler principal
  const handleDownload = async (): Promise<void> => {
    try {
      if (children) {
        // Si children existe → Mode HTML
        await handleHTMLToPDF();
      } else if (generateContent) {
        // Si generateContent existe → Mode Code
        await handleCodeToPDF();
      } else {
        throw new Error('Either children or generateContent must be provided');
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('PDF generation error:', error);
      const err = error instanceof Error ? error : new Error('Unknown error');
      if (onError) {
        onError(err);
      } else {
        alert('Error generating PDF. Please try again.');
      }
    }
  };

  const defaultButtonStyle: CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ...buttonStyle
  };

  return (
    <div>
      {/* Mode HTML : Affiche le contenu */}
      {children && (
        <div ref={contentRef} style={{ marginBottom: '20px' }}>
          {children}
        </div>
      )}

      {/* Le bouton */}
      <button
        onClick={handleDownload}
        style={defaultButtonStyle}
        className={className}
        type="button"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default PDFDownloadButton;