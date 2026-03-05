import { useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function SignaturePad({ onSave }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1a56db";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    setLastPos(getPos(e));
    setHasSignature(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const endDraw = (e) => {
    e.preventDefault();
    setDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-blue-200 rounded-xl overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-400">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={clear} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
          <RotateCcw size={12} /> Clear
        </button>
        <button
          onClick={save}
          disabled={!hasSignature}
          className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
}