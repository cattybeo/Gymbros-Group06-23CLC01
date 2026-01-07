import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onResult: (decodedText: string) => void;
  isScanning: boolean;
}

export function BarcodeScanner({ onResult, isScanning }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);

  const handleScan = useCallback((decodedText: string) => {
    onResult(decodedText);
  }, [onResult]);

  useEffect(() => {
    const containerId = 'barcode-reader';

    const startScanner = async () => {
      if (isStartingRef.current || scannerRef.current) return;
      isStartingRef.current = true;

      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
          },
          handleScan,
          () => {} // Ignore continuous scan errors
        );
      } catch (error) {
        console.error('Failed to start scanner:', error);
      } finally {
        isStartingRef.current = false;
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (error) {
          console.error('Failed to stop scanner:', error);
        }
        scannerRef.current = null;
      }
      isStartingRef.current = false;
    };

    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScanning, handleScan]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black">
      <div
        id="barcode-reader"
        className="w-full aspect-video"
      />
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[210px] h-[210px] border-2 border-primary rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  );
}
