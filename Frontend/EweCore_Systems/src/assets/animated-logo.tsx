/**
 * EWE CORE animated splash screen.
 * Plays the intro animation (~2.2s), then continues with a subtle idle pulse
 * on the core node. Duration controlled by parent component.
 */
export function SplashScreen() {

  return (
    <div className="ewe-splash">
      <svg className="ewe-splash-icon" viewBox="0 0 800 800">
        <polygon
          className="hex"
          points="400.00,70.00 634.90,235.00 634.90,565.00 400.00,730.00 165.10,565.00 165.10,235.00"
        />
        <circle className="orbit" cx="400" cy="400" r="160" />

        <line className="conn conn1" x1="400" y1="400" x2="400" y2="240" />
        <line className="conn conn2" x1="400" y1="400" x2="538.6" y2="480" />
        <line className="conn conn3" x1="400" y1="400" x2="261.4" y2="480" />

        <circle className="node node1" cx="400" cy="240" r="27" />
        <circle className="node node2" cx="538.6" cy="480" r="27" />
        <circle className="node node3" cx="261.4" cy="480" r="27" />

        <circle className="core-glow" cx="400" cy="400" r="72" />
        <circle className="core" cx="400" cy="400" r="72" />
        <ellipse className="core-hl" cx="377" cy="374" rx="30" ry="20" />
      </svg>

      <div className="ewe-splash-wordmark">
        <span className="ewe">EWE</span>
        <span className="core">CORE</span>
      </div>
      <div className="ewe-splash-tagline">OPERATIONS PLATFORM</div>
      <div className="ewe-splash-underline" />

      <style>{`
        .ewe-splash{
          position:fixed; inset:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          background:#073F2D;
          font-family:'Poppins', Arial, sans-serif;
        }
        .ewe-splash-icon{ width:280px; height:280px; overflow:visible; }

        .ewe-splash .hex{
          fill:none; stroke:#FFFFFF; stroke-width:20;
          stroke-linejoin:miter; stroke-linecap:butt; stroke-miterlimit:10;
          stroke-dasharray:1800; stroke-dashoffset:1800;
          animation:ewe-draw 900ms cubic-bezier(.4,0,.2,1) forwards;
        }
        .ewe-splash .orbit{
          fill:none; stroke:#FFFFFF; stroke-width:4; opacity:0;
          animation:ewe-fade 400ms ease forwards; animation-delay:650ms;
        }
        .ewe-splash .conn{
          stroke:#FFFFFF; stroke-width:9; stroke-linecap:round;
          stroke-dasharray:170; stroke-dashoffset:170;
          animation:ewe-draw 380ms ease forwards;
        }
        .ewe-splash .conn1{ animation-delay:850ms; }
        .ewe-splash .conn2{ animation-delay:950ms; }
        .ewe-splash .conn3{ animation-delay:1050ms; }

        .ewe-splash .node{
          fill:#FFFFFF; transform-box:fill-box; transform-origin:center;
          transform:scale(0); opacity:0;
          animation:ewe-pop 420ms cubic-bezier(.34,1.56,.64,1) forwards;
        }
        .ewe-splash .node1{ animation-delay:900ms; }
        .ewe-splash .node2{ animation-delay:1000ms; }
        .ewe-splash .node3{ animation-delay:1100ms; }

        .ewe-splash .core-glow{
          fill:#C9972C; transform-box:fill-box; transform-origin:center; opacity:0;
          animation:ewe-glow 2.2s ease-in-out infinite; animation-delay:1450ms;
        }
        .ewe-splash .core{
          fill:#C9972C; stroke:#FFFFFF; stroke-width:9;
          transform-box:fill-box; transform-origin:center;
          transform:scale(0); opacity:0;
          animation:ewe-pop 520ms cubic-bezier(.34,1.56,.64,1) forwards;
          animation-delay:1250ms;
        }
        .ewe-splash .core-hl{
          fill:#E8C468; opacity:0;
          animation:ewe-fade 300ms ease forwards; animation-delay:1550ms;
        }

        .ewe-splash-wordmark{
          margin-top:28px; font-size:36px; font-weight:700; letter-spacing:1px;
          opacity:0; transform:translateY(14px);
          animation:ewe-rise 550ms cubic-bezier(.2,.8,.2,1) forwards;
          animation-delay:1500ms;
        }
        .ewe-splash-wordmark .ewe{ color:#FFFFFF; }
        .ewe-splash-wordmark .core{ color:#E8C468; margin-left:6px; }

        .ewe-splash-tagline{
          margin-top:8px; font-size:12px; font-weight:500; letter-spacing:6px;
          color:#BFD3CB; opacity:0;
          animation:ewe-fade 500ms ease forwards; animation-delay:1850ms;
        }
        .ewe-splash-underline{
          width:0; height:2px; background:#E8C468; margin-top:12px; opacity:.7;
          animation:ewe-grow 500ms ease forwards; animation-delay:2000ms;
        }

        @keyframes ewe-draw{ to{ stroke-dashoffset:0; } }
        @keyframes ewe-fade{ to{ opacity:1; } }
        @keyframes ewe-pop{ to{ transform:scale(1); opacity:1; } }
        @keyframes ewe-rise{ to{ opacity:1; transform:translateY(0); } }
        @keyframes ewe-grow{ to{ width:190px; } }
        @keyframes ewe-glow{
          0%{ opacity:0; transform:scale(.9); }
          50%{ opacity:.35; transform:scale(1.35); }
          100%{ opacity:0; transform:scale(.9); }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;