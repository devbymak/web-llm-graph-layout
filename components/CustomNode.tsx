import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface CustomNodeProps {
  data: {
    label: string;
    type: string;
    value?: string | number;
    objectType?: string;
  };
}

const getNodeStyle = (type: string, objectType?: string) => {
  switch (type) {
    case 'literalVar':
      return 'bg-blue-900/80 border-blue-500 text-blue-100';
    case 'byRefVar':
      return 'bg-purple-900/80 border-purple-500 text-purple-100';
    case 'obj':
      return 'bg-orange-900/80 border-orange-500 text-orange-100';
    case 'literalProp':
      return 'bg-green-900/80 border-green-500 text-green-100';
    case 'byRefProp':
      return 'bg-teal-900/80 border-teal-500 text-teal-100';
    default:
      return 'bg-slate-800 border-slate-600 text-slate-200';
  }
};

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const styles = getNodeStyle(data.type, data.objectType);

  return (
    <div className={`px-4 py-2 rounded-md border shadow-lg min-w-[120px] backdrop-blur-sm ${styles}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      
      <div className="flex flex-col items-center">
        <div className="text-xs font-bold uppercase opacity-70 mb-1 tracking-wider">
          {data.objectType || data.type}
        </div>
        <div className="text-sm font-medium">
          {data.label || data.objectType || 'Node'}
        </div>
        {data.value !== undefined && data.value !== "*" && (
           <div className="mt-1 text-xs bg-black/20 px-2 py-0.5 rounded text-white/90 font-mono">
             {String(data.value)}
           </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
};

export default memo(CustomNode);
