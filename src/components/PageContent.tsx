import { Header } from "@/sections/Header";

export const PageContent = () => {
  return (
    <div className="bg-no-repeat box-border caret-transparent basis-0 grow h-[1000px] max-w-full w-full overflow-auto">
      <Header />
      <div className="bg-no-repeat box-border caret-transparent"></div>
    </div>
  );
};
