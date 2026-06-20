export function SearchInput({ defaultValue, category }: { defaultValue: string; category?: string }) {
  return (
    <form action="/catalogue" method="get" className="flex gap-2 flex-1 max-w-sm">
      {category && <input type="hidden" name="category" value={category} />}
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Rechercher un produit..."
        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40"
      />
      <button type="submit" className="btn-primary text-sm px-4 py-2">
        Chercher
      </button>
    </form>
  );
}
