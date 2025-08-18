import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useClassList } from "@/context/ClassListContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ClassesCard({ sections = [] }) {
  const navigate = useNavigate();
  const { setSelectedSection } = useClassList();

  const handleViewClassList = (section) => {
    setSelectedSection(section);
    navigate("/admin/classes/view");
  };

  return (
    <>
      {/* display sections */}
      <Tabs defaultValue="class" className="space-y-2">
        <TabsList>
          <TabsTrigger value="class" className="flex-1 sm:flex-initial">
            Classes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="class">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {sections.sort((a, b) => {
              // extract number from section names (e.g., "BT-101" => 101)
              const getSectionNumber = (name) => {
                const match = name.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
              };
              // sort section prefix (e.g, "BT")
              const prefixA = a.sectionName.split("-")[0];
              const prefixB = b.sectionName.split("-")[0];
              if (prefixA !== prefixB) {
                return prefixA.localeCompare(prefixB);
              }

              // sort by section number
              return getSectionNumber(a.sectionName) - getSectionNumber(b.sectionName)
            })
              .map((section) => (
                <Card key={section.id} className="overflow-hidden h-auto">
                  <CardHeader>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={section.id} className="border-none">
                        <AccordionTrigger className="cursor-pointer bg-secondary px-3 py-3 sm:p-4 flex items-center justify-between text-sm sm:text-base">
                          <span className="text-left truncate overflow-hidden text-ellipsis whitespace-nowrap">
                            {section.sectionName || "Section"}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm p-0 text-muted-foreground">
                          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-center w-full gap-2 sm:gap-3 p-2 sm:p-3">
                            <div className="w-full sm:flex-1 sm:mr-2">
                              <Button
                                className="w-full cursor-pointer text-xs sm:text-sm"
                                size="sm"
                                onClick={() => handleViewClassList(section)}
                              >
                                View Class List
                              </Button>
                            </div>
                            <div className="w-full sm:flex-1">
                              <Button
                                className="w-full cursor-pointer text-xs sm:text-sm"
                                size="sm"
                              >
                                View Schedule
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardHeader>
                </Card>
              ))}


          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
