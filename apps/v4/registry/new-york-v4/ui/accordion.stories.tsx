import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion"

/**
 *
 */

const meta = {
  // title: "ui/Accordion",
  component: Accordion,
  subcomponents: { AccordionItem, AccordionTrigger, AccordionContent },
  // parameters: {
  //   layout: "centered",
  //   design: {
  //       type: 'figma',
  //       url: 'https://www.figma.com/design/XXXXXXXXXXXXXXXXXXXXXX/MyFigFile?node-id=XXXXX-XXXXXX',
  //   },
  // },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

//

/**
 *
 */

export const St1: Story = {
  name: "Default",
  args: {
    type: "single",
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you
          prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
