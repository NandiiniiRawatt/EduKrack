from manim import *

class EducationalScene(Scene):
    def construct(self):
        title = Text("{{title}}", font_size=48).to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        bullets = {{bullets_list}}
        for i, b in enumerate(bullets):
            txt = Text(b, font_size=28)
            txt.to_edge(LEFT)
            txt.shift(DOWN * (i * 0.8 + 1))
            self.play(FadeIn(txt))
            self.wait(0.6)

        self.wait(1)
