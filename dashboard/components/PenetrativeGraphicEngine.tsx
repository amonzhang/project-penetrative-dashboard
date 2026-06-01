"use client";
import React from 'react';
import { SegmentKey, hexToRgba } from './project-data';

// ── 3D Custom CSS Animation Styles ──
export function PenetrativeGraphicStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes flowStripes {
        0% { background-position: 0 0; }
        100% { background-position: 32px 0; }
      }
      .animate-flow-stripes {
        animation: flowStripes 1.8s linear infinite !important;
      }
      @keyframes pulseGlowFront {
        0%, 100% {
          opacity: 0.8;
          box-shadow: 0 0 10px 1px var(--glow-color), 0 0 4px 0.5px #ffffff;
        }
        50% {
          opacity: 1;
          box-shadow: 0 0 16px 2.5px var(--glow-color), 0 0 6px 1px #ffffff;
        }
      }
      .animate-pulse-glow {
        animation: pulseGlowFront 1.4s ease-in-out infinite !important;
      }
      @keyframes badgePulse {
        0%, 100% { opacity: 0.95; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.02); }
      }
      .animate-badge-pulse {
        animation: badgePulse 2s ease-in-out infinite !important;
      }
    `}} />
  );
}

// ── 3D Cylinder Glass Reflection ──
export const CYLINDER_REFLECTION = 
  'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.65) 12%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.04) 75%, rgba(0,0,0,0.2) 100%)';

// ── 3D Capsule Color Schemes ──
export const CAPSULE_SCHEMES = {
  blue: {
    bg: 'from-sky-500 to-blue-600',
    border: 'border-blue-400/40',
    shadow: 'shadow-blue-200/40',
    glow: '#3b82f6',
    color: '#2563eb'
  },
  indigo: {
    bg: 'from-indigo-500 to-indigo-700',
    border: 'border-indigo-400/40',
    shadow: 'shadow-indigo-200/40',
    glow: '#6366f1',
    color: '#4f46e5'
  },
  violet: {
    bg: 'from-purple-500 to-purple-700',
    border: 'border-purple-400/40',
    shadow: 'shadow-purple-200/40',
    glow: '#a855f7',
    color: '#8b5cf6'
  },
  teal: {
    bg: 'from-teal-500 to-emerald-600',
    border: 'border-emerald-400/40',
    shadow: 'shadow-emerald-200/40',
    glow: '#10b981',
    color: '#0d9488'
  },
  orange: {
    bg: 'from-amber-500 to-orange-600',
    border: 'border-orange-400/40',
    shadow: 'shadow-orange-200/40',
    glow: '#f97316',
    color: '#f97316'
  },
  rose: {
    bg: 'from-rose-500 to-rose-700',
    border: 'border-red-400/30',
    shadow: 'shadow-red-200/40',
    glow: '#f43f5e',
    color: '#e11d48'
  }
};

export type CapsuleColorType = keyof typeof CAPSULE_SCHEMES;

// ── Diagonal Hatch Pattern Generator ──
export const getHatchPattern = (color: string, a1 = 0.25, a2 = 0.6, size = 6) =>
  `repeating-linear-gradient(45deg, ${hexToRgba(color, a1)} 0px, ${hexToRgba(color, a1)} ${size}px, ${hexToRgba(color, a2)} ${size}px, ${hexToRgba(color, a2)} ${size * 2}px)`;

// 1. BudgetSlot - 3D Carved Slide Groove (凹陷控制卡槽)
interface BudgetSlotProps {
  left?: number;
  width?: number;
  isHovered?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  className?: string;
  children?: React.ReactNode;
}
export function BudgetSlot({
  left = 0,
  width = 100,
  isHovered = false,
  borderColor = '#e2e8f0', // slate-200
  backgroundColor = '#f1f5f9', // slate-100
  className = '',
  children
}: BudgetSlotProps) {
  return (
    <div
      className={`absolute inset-y-0 rounded-full transition-all duration-500 overflow-hidden ${className}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: isHovered ? '#e2e8f0' : backgroundColor,
        border: `1.5px solid ${isHovered ? '#cbd5e1' : borderColor}`,
        // 3D Inset Shadows simulating physical groove depth carved into the panel
        boxShadow: `
          inset 0 3px 5px rgba(15, 23, 42, 0.08), 
          inset 0 1px 2px rgba(15, 23, 42, 0.04),
          0 1px 0.5px rgba(255, 255, 255, 0.8)
        `,
      }}
    >
      {/* Laser slide guide line inside the center of the track */}
      <div className="absolute inset-y-[50%] left-0 right-0 border-t border-dashed border-slate-300/35 pointer-events-none" />
      {children}
    </div>
  );
}

// 2. CylinderCapsule - 3D Translucent Sliding Glass Cylinder (立体三维滑动胶囊)
interface CylinderCapsuleProps {
  left: number;
  width: number;
  colorType: CapsuleColorType;
  heightClass?: string;
  isHovered?: boolean;
  opacity?: number;
  children?: React.ReactNode;
}
export function CylinderCapsule({
  left,
  width,
  colorType,
  heightClass = 'inset-y-1',
  isHovered = false,
  opacity = 0.96,
  children
}: CylinderCapsuleProps) {
  const scheme = CAPSULE_SCHEMES[colorType] || CAPSULE_SCHEMES.blue;

  return (
    <div
      className={`absolute ${heightClass} rounded-full transition-all duration-500 overflow-hidden border shadow-md bg-gradient-to-b ${scheme.bg} ${scheme.border} ${
        isHovered ? 'scale-y-[1.08] shadow-2xl brightness-[1.06] border-white/80' : ''
      }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        opacity: opacity,
        // Double layer shadow bevel details
        boxShadow: isHovered
          ? `0 5px 12px rgba(15, 23, 42, 0.13), inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -1.5px 2.5px rgba(0,0,0,0.18)`
          : `0 2.5px 5px rgba(15, 23, 42, 0.09), inset 0 1px 1.5px rgba(255,255,255,0.5), inset 0 -1px 1.5px rgba(0,0,0,0.12)`,
      }}
    >
      {/* 3D Glass Cylinder Reflection Surface */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          background: CYLINDER_REFLECTION
        }}
      />
      {/* High-intensity Ambient Specular Reflection Stripe */}
      <div className="absolute top-[4%] left-[2%] right-[2%] h-[12%] bg-white/45 rounded-full blur-[0.5px] pointer-events-none" />
      
      {children}
    </div>
  );
}

// 3. HatchedFlow - 3D Flowing Liquid Cylinder (流动型内嵌收付款/现金流)
interface HatchedFlowProps {
  width: number; // 相对比例 (0 ~ 100)
  color?: string; // 嵌套条纹颜色
  glowColor?: string;
  children?: React.ReactNode;
}
export function HatchedFlow({
  width,
  color = '#ffffff',
  glowColor = '#10b981',
  children
}: HatchedFlowProps) {
  return (
    <div
      className="absolute inset-y-0 left-0 transition-[width] duration-500 rounded-l-full overflow-hidden animate-flow-stripes"
      style={{
        width: `${width}%`,
        backgroundImage: `repeating-linear-gradient(
          45deg, 
          ${hexToRgba(color, 0.16)} 0px, 
          ${hexToRgba(color, 0.16)} 8px, 
          ${hexToRgba(color, 0.42)} 8px, 
          ${hexToRgba(color, 0.42)} 16px
        )`,
        backgroundSize: '32px 100%',
      }}
    >
      {/* 3D Glass Cylinder Overlay for fluid volume depth */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45" 
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.55) 15%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%)'
        }}
      />
      
      {/* Right Edge Glow Laser Boundary Dot */}
      {width > 0 && (
        <div 
          className="absolute top-0 bottom-0 right-0 w-[4px] bg-white pointer-events-none rounded-full animate-pulse-glow"
          style={{
            '--glow-color': glowColor,
            boxShadow: `0 0 12px 2px ${glowColor}, 0 0 4px 1px #ffffff`
          } as React.CSSProperties}
        />
      )}
      {children}
    </div>
  );
}

// 4. TreePipeConnector - Industrial Piping Junction (工业三维直角管道接线器)
interface TreePipeConnectorProps {
  isLast?: boolean;
  color?: string;
  glowColor?: string;
}
export function TreePipeConnector({
  isLast = false,
  color = '#cbd5e1', // slate-300
  glowColor = '#3b82f6'
}: TreePipeConnectorProps) {
  return (
    <div className="absolute left-[-16px] top-0 bottom-0 w-4 pointer-events-none select-none">
      {/* Vertical Spine (Down to next row unless it is the last item) */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[1.5px] opacity-70"
        style={{
          backgroundColor: color,
          bottom: isLast ? '50%' : '0%'
        }}
      />
      {/* Horizontal Outflow Pipe */}
      <div 
        className="absolute left-0 top-[50%] w-[14px] h-[1.5px] opacity-70"
        style={{
          backgroundColor: color
        }}
      />
      {/* Glass Bead Neon LED Junction Dot */}
      <div 
        className="absolute left-[-3.5px] top-[calc(50%-4px)] w-[9px] h-[9px] rounded-full border-2 border-white bg-slate-100 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
        style={{
          boxShadow: `0 0 5px 1.5px ${glowColor}, inset 0 1px 2px rgba(0,0,0,0.15)`,
          backgroundColor: glowColor
        }}
      />
    </div>
  );
}

// 5. GlowingLabelBadge - Hover-Slide Pill Badge (悬停发光药丸)
interface GlowingLabelBadgeProps {
  show: boolean;
  text: string;
  type?: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
}
export function GlowingLabelBadge({
  show,
  text,
  type = 'blue'
}: GlowingLabelBadgeProps) {
  if (!show) return null;

  const styles = {
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    blue: 'bg-blue-100 text-blue-800 border-blue-300 shadow-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.2)]',
    amber: 'bg-amber-100 text-amber-800 border-amber-300 shadow-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    rose: 'bg-rose-100 text-rose-800 border-rose-300 shadow-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
    slate: 'bg-slate-100 text-slate-700 border-slate-300 shadow-slate-50'
  };

  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border tracking-wider animate-badge-pulse transition-all duration-300 ${styles[type]}`}>
      {text}
    </span>
  );
}
