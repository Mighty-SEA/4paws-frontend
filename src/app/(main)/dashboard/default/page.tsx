/* eslint-disable import/order */
import { ChartAreaInteractive } from "./_components/chart-area-interactive";
import data from "./_components/data.json";
import { DataTable } from "./_components/data-table";
import { OwnerForm } from "./_components/owner-form";
import { SectionCards } from "./_components/section-cards";
/* eslint-enable import/order */

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <OwnerForm />
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={data} />
    </div>
  );
}
