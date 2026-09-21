/** 켜고 끄는 스위치 (11장 「경로 안내」) */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-[#d4d7d2]'}`}
    >
      {/* left 를 주지 않으면 버튼의 가운데 정렬 기준으로 놓여 손잡이가 밖으로 밀려난다 */}
      <span
        className={`absolute left-1 top-1 size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
          checked ? 'translate-x-[1.25rem]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
