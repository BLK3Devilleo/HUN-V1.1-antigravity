'use client';

export default function ContentStack() {
  return (
    <div className="relative w-full h-full">
      {/* Single dark gray rectangle - no stacking, per Canva Page 3 */}
      <div
        className="w-full h-full"
        style={{
          background: '#999999',
          borderRadius: '20px',
        }}
      />
    </div>
  );
}
