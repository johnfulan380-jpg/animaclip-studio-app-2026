import { Bone, SkeletonPose } from '../types/animation';

/**
 * Creates a ready-to-animate Humanoid Character Skeletal Rig
 */
export function createHumanoidSkeleton(centerX: number = 640, centerY: number = 380): Bone[] {
  return [
    {
      id: 'bone-root',
      name: 'Quadril / Raiz',
      parentId: null,
      startPoint: { x: centerX, y: centerY },
      endPoint: { x: centerX, y: centerY - 90 },
      length: 90,
      angle: -90,
      color: '#f97316',
    },
    {
      id: 'bone-torso',
      name: 'Tronco',
      parentId: 'bone-root',
      startPoint: { x: centerX, y: centerY - 90 },
      endPoint: { x: centerX, y: centerY - 180 },
      length: 90,
      angle: -90,
      color: '#fb923c',
    },
    {
      id: 'bone-head',
      name: 'Cabeça',
      parentId: 'bone-torso',
      startPoint: { x: centerX, y: centerY - 180 },
      endPoint: { x: centerX, y: centerY - 250 },
      length: 70,
      angle: -90,
      color: '#facc15',
    },
    // Left Arm
    {
      id: 'bone-arm-l',
      name: 'Braço Esquerdo',
      parentId: 'bone-torso',
      startPoint: { x: centerX - 25, y: centerY - 165 },
      endPoint: { x: centerX - 95, y: centerY - 120 },
      length: 80,
      angle: 150,
      color: '#38bdf8',
    },
    {
      id: 'bone-forearm-l',
      name: 'Antebraço Esquerdo',
      parentId: 'bone-arm-l',
      startPoint: { x: centerX - 95, y: centerY - 120 },
      endPoint: { x: centerX - 145, y: centerY - 70 },
      length: 70,
      angle: 135,
      color: '#0284c7',
    },
    // Right Arm
    {
      id: 'bone-arm-r',
      name: 'Braço Direito',
      parentId: 'bone-torso',
      startPoint: { x: centerX + 25, y: centerY - 165 },
      endPoint: { x: centerX + 95, y: centerY - 120 },
      length: 80,
      angle: 30,
      color: '#38bdf8',
    },
    {
      id: 'bone-forearm-r',
      name: 'Antebraço Direito',
      parentId: 'bone-arm-r',
      startPoint: { x: centerX + 95, y: centerY - 120 },
      endPoint: { x: centerX + 145, y: centerY - 70 },
      length: 70,
      angle: 45,
      color: '#0284c7',
    },
    // Left Leg
    {
      id: 'bone-leg-l',
      name: 'Coxa Esquerda',
      parentId: 'bone-root',
      startPoint: { x: centerX - 25, y: centerY },
      endPoint: { x: centerX - 45, y: centerY + 100 },
      length: 100,
      angle: 100,
      color: '#4ade80',
    },
    {
      id: 'bone-shin-l',
      name: 'Perna Esquerda',
      parentId: 'bone-leg-l',
      startPoint: { x: centerX - 45, y: centerY + 100 },
      endPoint: { x: centerX - 55, y: centerY + 195 },
      length: 95,
      angle: 95,
      color: '#16a34a',
    },
    // Right Leg
    {
      id: 'bone-leg-r',
      name: 'Coxa Direita',
      parentId: 'bone-root',
      startPoint: { x: centerX + 25, y: centerY },
      endPoint: { x: centerX + 45, y: centerY + 100 },
      length: 100,
      angle: 80,
      color: '#4ade80',
    },
    {
      id: 'bone-shin-r',
      name: 'Perna Direita',
      parentId: 'bone-leg-r',
      startPoint: { x: centerX + 45, y: centerY + 100 },
      endPoint: { x: centerX + 55, y: centerY + 195 },
      length: 95,
      angle: 85,
      color: '#16a34a',
    },
  ];
}

/**
 * Draws stylized animation rigging bones with joint circles and tapered diamond body
 */
export function drawSkeletalBones(
  ctx: CanvasRenderingContext2D,
  bones: Bone[],
  selectedBoneId: string | null = null,
  isPosing: boolean = true
) {
  ctx.save();

  bones.forEach((bone) => {
    const isSelected = bone.id === selectedBoneId;
    const { startPoint: s, endPoint: e } = bone;

    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    // Bone diamond width (proportional to length)
    const boneWidth = Math.max(7, Math.min(18, len * 0.16));
    const midRatio = 0.25; // 25% from root joint
    const midX = s.x + dx * midRatio;
    const midY = s.y + dy * midRatio;

    // 1. Draw Bone Diamond Body
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(midX + nx * boneWidth, midY + ny * boneWidth);
    ctx.lineTo(e.x, e.y);
    ctx.lineTo(midX - nx * boneWidth, midY - ny * boneWidth);
    ctx.closePath();

    ctx.fillStyle = isSelected
      ? 'rgba(239, 68, 68, 0.75)'
      : isPosing
      ? 'rgba(56, 189, 248, 0.65)'
      : 'rgba(251, 146, 60, 0.65)';
    ctx.fill();

    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    // 2. Draw Start Joint Pivot Circle
    ctx.beginPath();
    ctx.arc(s.x, s.y, isSelected ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#ef4444' : bone.color || '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Draw End Tip Circle
    ctx.beginPath();
    ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 4. Draw Bone Name Label if selected
    if (isSelected) {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(bone.name, e.x + 8, e.y + 4);
      ctx.shadowBlur = 0;
    }
  });

  ctx.restore();
}

/**
 * Hit test: find bone or joint clicked near (x, y)
 */
export function hitTestBone(
  bones: Bone[],
  x: number,
  y: number,
  tolerance: number = 16
): { bone: Bone; hitPart: 'start' | 'end' | 'body' } | null {
  for (let i = bones.length - 1; i >= 0; i--) {
    const bone = bones[i];

    // Check end point (tip)
    if (Math.hypot(bone.endPoint.x - x, bone.endPoint.y - y) <= tolerance) {
      return { bone, hitPart: 'end' };
    }

    // Check start point (joint)
    if (Math.hypot(bone.startPoint.x - x, bone.startPoint.y - y) <= tolerance) {
      return { bone, hitPart: 'start' };
    }

    // Check bone line segment
    const { startPoint: s, endPoint: e } = bone;
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > 0) {
      let t = ((x - s.x) * dx + (y - s.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = s.x + t * dx;
      const projY = s.y + t * dy;
      if (Math.hypot(x - projX, y - projY) <= tolerance) {
        return { bone, hitPart: 'body' };
      }
    }
  }

  return null;
}

/**
 * Forward Kinematics (FK): Rotates a bone around its joint and cascades rotation down to all descendants
 */
export function rotateBoneFK(
  bones: Bone[],
  targetBoneId: string,
  newAngleDeg: number
): Bone[] {
  const targetBone = bones.find((b) => b.id === targetBoneId);
  if (!targetBone) return bones;

  const angleDelta = newAngleDeg - targetBone.angle;
  const rad = (angleDelta * Math.PI) / 180;
  const pivot = targetBone.startPoint;

  // Rotate a point around pivot
  const rotatePoint = (pt: { x: number; y: number }): { x: number; y: number } => {
    const dx = pt.x - pivot.x;
    const dy = pt.y - pivot.y;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: pivot.x + (dx * cos - dy * sin),
      y: pivot.y + (dx * sin + dy * cos),
    };
  };

  // Find all descendant bones
  const descendantIds = new Set<string>([targetBoneId]);
  let added = true;
  while (added) {
    added = false;
    for (const b of bones) {
      if (b.parentId && descendantIds.has(b.parentId) && !descendantIds.has(b.id)) {
        descendantIds.add(b.id);
        added = true;
      }
    }
  }

  return bones.map((bone) => {
    if (!descendantIds.has(bone.id)) return bone;

    if (bone.id === targetBoneId) {
      const newEnd = rotatePoint(bone.endPoint);
      return {
        ...bone,
        angle: newAngleDeg,
        endPoint: newEnd,
      };
    } else {
      // Descendant bone: both start and end rotate around the target bone's joint
      return {
        ...bone,
        angle: bone.angle + angleDelta,
        startPoint: rotatePoint(bone.startPoint),
        endPoint: rotatePoint(bone.endPoint),
      };
    }
  });
}

/**
 * Translates a bone and all its descendants (e.g. moving the root/hip moves the entire character!)
 */
export function translateBoneTree(
  bones: Bone[],
  targetBoneId: string,
  dx: number,
  dy: number
): Bone[] {
  const descendantIds = new Set<string>([targetBoneId]);
  let added = true;
  while (added) {
    added = false;
    for (const b of bones) {
      if (b.parentId && descendantIds.has(b.parentId) && !descendantIds.has(b.id)) {
        descendantIds.add(b.id);
        added = true;
      }
    }
  }

  return bones.map((bone) => {
    if (!descendantIds.has(bone.id)) return bone;
    return {
      ...bone,
      startPoint: { x: bone.startPoint.x + dx, y: bone.startPoint.y + dy },
      endPoint: { x: bone.endPoint.x + dx, y: bone.endPoint.y + dy },
    };
  });
}
