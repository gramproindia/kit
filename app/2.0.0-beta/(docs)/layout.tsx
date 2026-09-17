import { getNav } from "../_lib/docs";
import { SidebarNav } from "../_components/SidebarNav";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const nav = await getNav();

  return (
    <div className="v2-container md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 xl:grid-cols-[13.5rem_minmax(0,1fr)_13rem] xl:gap-12">
      <aside className="hidden md:block">
        <div className="v2-sidebar">
          <SidebarNav nav={nav} />
        </div>
      </aside>
      {children}
    </div>
  );
}
