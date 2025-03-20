import { 
  H1, H2, H3, H4, P, Lead, Large, Small, Muted, 
  Blockquote, List, InlineCode 
} from "@/components/ui/typography";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function StyleGuide() {
  return (
    <div className="container mx-auto py-10 px-4">
      <H1>StickerVerse Style Guide</H1>
      <Lead className="mt-4">
        A comprehensive guide to the design system and component library used throughout the StickerVerse platform.
      </Lead>
      
      <Separator className="my-8" />
      
      <section className="mb-12">
        <H2>Typography</H2>
        <P>Consistent typography helps create clear hierarchies and organize information.</P>
        
        <div className="grid gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Heading Elements</CardTitle>
              <CardDescription>Different levels of headings for content hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <H1>Heading 1</H1>
                <Muted>Used for main page titles</Muted>
              </div>
              <div>
                <H2>Heading 2</H2>
                <Muted>Used for section titles</Muted>
              </div>
              <div>
                <H3>Heading 3</H3>
                <Muted>Used for subsection titles</Muted>
              </div>
              <div>
                <H4>Heading 4</H4>
                <Muted>Used for card titles and minor sections</Muted>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Text Elements</CardTitle>
              <CardDescription>Various text styles for different content needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Lead>Lead Paragraph</Lead>
                <Muted>Used for introductory text or summaries</Muted>
              </div>
              <div>
                <P>Standard Paragraph</P>
                <Muted>Used for the main body text throughout the application</Muted>
              </div>
              <div>
                <Large>Large Text</Large>
                <Muted>Used for emphasized text or important information</Muted>
              </div>
              <div>
                <Small>Small Text</Small>
                <Muted>Used for captions, footnotes, or secondary information</Muted>
              </div>
              <div>
                <Muted>Muted Text</Muted>
                <Small>Used for less important information or helper text</Small>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Content Elements</CardTitle>
              <CardDescription>Additional typographic elements for rich content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Blockquote>
                  "StickerVerse provides the most comprehensive sticker customization experience I've ever used."
                </Blockquote>
                <Muted>Used for testimonials or quotes</Muted>
              </div>
              <div>
                <List>
                  <li>First list item example</li>
                  <li>Second list item with <InlineCode>inline code</InlineCode></li>
                  <li>Third list item example</li>
                </List>
                <Muted>Used for unordered lists of information</Muted>
              </div>
              <div>
                <P>Regular text with <InlineCode>inline code</InlineCode> elements</P>
                <Muted>Used for technical information or code snippets</Muted>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="mb-12">
        <H2>Colors</H2>
        <P>Our color system provides visual consistency across the platform.</P>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <div className="h-24 rounded-md bg-primary"></div>
            <Small>Primary</Small>
            <Muted>Main brand color, used for buttons and important UI elements</Muted>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-24 rounded-md bg-secondary"></div>
            <Small>Secondary</Small>
            <Muted>Complementary color for alternative buttons and UI elements</Muted>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-24 rounded-md bg-accent"></div>
            <Small>Accent</Small>
            <Muted>Used for highlights and interactive elements</Muted>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-24 rounded-md bg-destructive"></div>
            <Small>Destructive</Small>
            <Muted>Used for errors and destructive actions</Muted>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-24 rounded-md bg-muted"></div>
            <Small>Muted</Small>
            <Muted>Used for backgrounds and subtle UI elements</Muted>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-24 rounded-md bg-card"></div>
            <Small>Card</Small>
            <Muted>Background color for card components</Muted>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <H2>Buttons</H2>
        <P>Buttons provide interactive elements for user actions.</P>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different styles for different contexts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <Muted>Choose the appropriate button variant based on the action's importance and context</Muted>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Button Sizes</CardTitle>
              <CardDescription>Different sizes for different needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon" className="rounded-full"><span className="text-lg">+</span></Button>
              </div>
              <Muted>Choose the appropriate button size based on available space and importance</Muted>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Button States</CardTitle>
              <CardDescription>Visual feedback for different states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button disabled>Disabled</Button>
                <Button variant="outline" className="ring-2 ring-primary ring-offset-2">Focused</Button>
                <Button className="bg-primary/80 hover:bg-primary/70">Hover/Active</Button>
              </div>
              <Muted>Buttons provide visual feedback based on their state</Muted>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Button Applications</CardTitle>
              <CardDescription>Common ways to use buttons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-end gap-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save</Button>
                </div>
                
                <div className="flex justify-center">
                  <Button className="w-full sm:w-auto">Center Action</Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full h-8 w-8">-</Button>
                  <span>1</span>
                  <Button variant="outline" size="icon" className="rounded-full h-8 w-8">+</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="mb-12">
        <H2>Glass Cards</H2>
        <P>Glass effect cards provide a modern and visually appealing way to present content.</P>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          <GlassCard 
            title="Standard Card" 
            description="Medium glass effect"
            glassEffect="medium"
          >
            <P>This card uses the default medium glass effect, providing a semi-transparent backdrop that works well in most contexts.</P>
          </GlassCard>
          
          <GlassCard 
            title="Light Glass" 
            description="Subtle transparency"
            glassEffect="light"
            footer={<Button size="sm">Action</Button>}
          >
            <P>The light glass effect is more subtle, allowing more of the background to show through.</P>
          </GlassCard>
          
          <GlassCard 
            title="Heavy Glass" 
            description="More opaque background"
            glassEffect="heavy"
            footer={<>
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm">Submit</Button>
            </>}
          >
            <P>The heavy glass effect provides more opacity, improving text readability while still maintaining the glass aesthetic.</P>
          </GlassCard>
          
          <GlassCard 
            title="Color Morphing Card" 
            description="Interactive color transitions"
            glassEffect="light"
            colorMorph={true}
            colors={["rgba(59, 130, 246, 0.15)", "rgba(124, 58, 237, 0.15)", "rgba(236, 72, 153, 0.15)"]}
          >
            <P>This card features a color morphing effect that subtly transitions between different color states.</P>
          </GlassCard>
          
          <GlassCard 
            title={<div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">💡</div>
              <span>Custom Header</span>
            </div>}
            description="With custom components"
            glassEffect="medium"
          >
            <div className="space-y-4">
              <P>Cards can contain custom header components for more visual interest.</P>
              <div className="bg-primary/10 p-3 rounded-md">
                <Small>Nested content example</Small>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard glassEffect="medium">
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center text-primary text-2xl">✨</div>
              <H3>No Header/Footer</H3>
              <P className="mt-2">Cards can also be used without headers or footers for simpler content presentation.</P>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}