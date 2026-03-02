import { PageContent } from "@/components/PageContent";
import { NotificationList } from "@/components/NotificationList";

export const ContentWrapper = () => {
  return (
    <div className="relative bg-no-repeat box-border caret-transparent flex flex-col grow max-w-full min-h-[1000px]">
      <div className="bg-no-repeat box-border caret-transparent flex grow flex-wrap h-full">
        <PageContent />
      </div>
      <span className="bg-no-repeat box-border caret-transparent block"></span>
      <NotificationList />
    </div>
  );
};
