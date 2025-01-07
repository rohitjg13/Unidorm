import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function WingDrawer({ selectedWing, setSelectedWing }: {
  selectedWing: string,
  setSelectedWing: (wing: string) => void
}) {
  const [wing, setWing] = React.useState("A")
  const [open, setOpen] = React.useState(false)

  const handleSubmit = () => {
    setSelectedWing(wing)
    setOpen(false)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="text-black" style={{ borderRadius: 10 }}>
          {selectedWing ? `Wing ${selectedWing}` : "Select Wing"}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Select Wing</DrawerTitle>
            <DrawerDescription>Choose your wing section.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <RadioGroup defaultValue="A" onValueChange={setWing} value={wing}>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="A" id="wing-a" />
                <Label htmlFor="wing-a">Wing A</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="B" id="wing-b" />
                <Label htmlFor="wing-b">Wing B</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="C" id="wing-c" />
                <Label htmlFor="wing-c">Wing C</Label>
              </div>
            </RadioGroup>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit}>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}