export function RenderGallery({ items, isLoading, onRemove, onClearAll }) {
  return (
    <div className="absolute bottom-4 left-4 z-20 w-[360px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/92 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <p className="text-xs font-semibold text-zinc-200">本地作品库</p>
        <button onClick={onClearAll} className="text-[11px] text-zinc-400 hover:text-rose-300">
          清空
        </button>
      </div>
      <div className="max-h-[200px] space-y-2 overflow-auto p-3">
        {isLoading ? <div className="text-xs text-zinc-500">加载中...</div> : null}
        {!isLoading && !items.length ? <div className="text-xs text-zinc-500">暂无本地渲染图</div> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2">
            <img
              src={item.previewUrl}
              alt="render preview"
              className="h-24 w-full rounded border border-zinc-800 object-cover"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span>{new Date(item.createdAt).toLocaleString()}</span>
              <div className="flex gap-2">
                <a
                  href={item.previewUrl}
                  download={`render-local-${item.id}.png`}
                  className="rounded bg-emerald-600/25 px-2 py-0.5 text-emerald-300"
                >
                  下载
                </a>
                <button onClick={() => onRemove(item.id)} className="rounded bg-rose-600/25 px-2 py-0.5 text-rose-300">
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
