import { ContentWrapper } from "@/components/ContentWrapper";

export const MainContainer = () => {
  return (
    <div className="absolute bg-no-repeat box-border caret-transparent inset-0">
      <div className="text-black/90 bg-white box-border caret-transparent flex grow h-full font-inter">
        <ContentWrapper />
      </div>
      <div className="fixed bg-no-repeat box-border caret-transparent">
        <div className="bg-no-repeat box-border caret-transparent hidden">
          <div className="bg-no-repeat box-border caret-transparent max-w-sm"></div>
        </div>
      </div>
    </div>
  );
};
