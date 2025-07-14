from manim import *

class TrigonometryDemo(Scene):
    def construct(self):
        # Step 1: Simulate user typing - smaller font size
        user_input = Text("Explain me the topic on sine and cosine", font_size=24).to_edge(UP, buff=0.3)
        self.play(Write(user_input))
        self.wait(0.5)

        # Step 2: Show 'Generating video...' - smaller font size
        loading = Text("Generating video on 'Sine and Cosine'...", font_size=20).next_to(user_input, DOWN, buff=0.2)
        self.play(Write(loading))
        self.wait(1)
        self.play(FadeOut(loading), FadeOut(user_input))

        # Step 3: Show title - reduced size
        title = Text("Sine and Cosine Functions", font_size=36).to_edge(UP, buff=0.3)
        self.play(FadeIn(title))
        self.wait(0.5)

        # Set up coordinate system - further reduced size
        axes = Axes(
            x_range=[-1, 7, 1],
            y_range=[-1.5, 1.5, 0.5],
            x_length=7,  # Even smaller width
            y_length=4,  # Even smaller height
            axis_config={"include_tip": False}
        )
        
        # Add labels - smaller font size
        x_label = Text("θ (angle)", font_size=18).next_to(axes.get_x_axis(), RIGHT)
        y_label = Text("f(θ)", font_size=18).next_to(axes.get_y_axis(), UP)
        
        # Add special angle labels on x-axis - smaller font size
        x_labels = VGroup()
        special_points = [0, PI/2, PI, 3*PI/2, 2*PI]
        special_labels = ["0", "π/2", "π", "3π/2", "2π"]
        
        for point, label in zip(special_points, special_labels):
            text = Text(label, font_size=14)
            text.next_to(axes.c2p(point, 0), DOWN, buff=0.1)
            x_labels.add(text)
        
        # Create coordinate system group and position it more carefully
        coordinate_system = VGroup(axes, x_label, y_label, x_labels)
        coordinate_system.scale(0.95)  # Scale down slightly
        coordinate_system.center().shift(DOWN * 0.5)  # Move down slightly
        
        # Show coordinate system
        self.play(Create(axes), Write(x_label), Write(y_label))
        self.play(Write(x_labels))
        self.wait(0.5)
        
        # Define sine and cosine functions
        sin_graph = axes.plot(lambda x: np.sin(x), color=BLUE, x_range=[0, 2*PI])
        cos_graph = axes.plot(lambda x: np.cos(x), color=RED, x_range=[0, 2*PI])
        
        sin_label = Text("sin(θ)", color=BLUE, font_size=18).next_to(axes.c2p(2*PI, 0.3), RIGHT)
        cos_label = Text("cos(θ)", color=RED, font_size=18).next_to(axes.c2p(2*PI, -0.3), RIGHT)
        
        # Show unit circle - moved to reduce overlapping
        unit_circle_center = axes.c2p(-1.8, 0)  # Moved more to the left
        unit_circle = Circle(radius=0.6, color=WHITE).move_to(unit_circle_center)  # Even smaller radius
        unit_circle_label = Text("Unit Circle", font_size=16).next_to(unit_circle, UP, buff=0.2)
        
        # Define angle for demonstration - adjusted sizes for smaller unit circle
        radius_line = Line(unit_circle_center, unit_circle_center + 0.6*RIGHT, color=YELLOW)
        angle_label = Text("θ", font_size=20, color=YELLOW)
        angle_label.move_to(unit_circle_center + 0.3*RIGHT + 0.15*UP)
        
        # Create dots to track sine and cosine values
        sine_dot = Dot(color=BLUE, radius=0.05)  # Smaller dot
        cosine_dot = Dot(color=RED, radius=0.05)  # Smaller dot
        
        # Labels for showing the values on unit circle - smaller font
        sin_point_label = Text("sin(θ)", color=BLUE, font_size=14)
        cos_point_label = Text("cos(θ)", color=RED, font_size=14)
        
        # Show unit circle and explanation
        self.play(Create(unit_circle), Write(unit_circle_label))
        self.play(Create(radius_line), Write(angle_label))
        self.wait(0.5)
        
        # Show cosine definition - smaller font and positioned more carefully
        cos_definition = Text("Cosine = x-coordinate on unit circle", font_size=20, color=RED)
        cos_definition.to_edge(DOWN, buff=0.4)
        self.play(Write(cos_definition))
        
        # Show horizontal line to x-axis for cosine - scaled to match smaller unit circle
        cosine_line = Line(unit_circle_center, unit_circle_center + 0.6*RIGHT, color=RED)
        cosine_dot.move_to(unit_circle_center + 0.6*RIGHT)
        cos_point_label.next_to(cosine_dot, UR, buff=0.1)
        
        self.play(Create(cosine_line), FadeIn(cosine_dot), Write(cos_point_label))
        self.wait(0.5)
        
        # Show sine definition - smaller font
        self.play(FadeOut(cos_definition))
        sin_definition = Text("Sine = y-coordinate on unit circle", font_size=20, color=BLUE)
        sin_definition.to_edge(DOWN, buff=0.4)
        self.play(Write(sin_definition))
        
        # Show vertical line for sine - scaled to match smaller unit circle
        sine_line = Line(unit_circle_center + 0.6*RIGHT, unit_circle_center + 0.6*RIGHT + UP*0, color=BLUE)
        sine_dot.move_to(unit_circle_center + 0.6*RIGHT)
        sin_point_label.next_to(sine_dot, RIGHT, buff=0.1)
        
        self.play(Create(sine_line), FadeIn(sine_dot), Write(sin_point_label))
        self.wait(0.5)
        
        # Animate the angle changing - smaller font
        self.play(FadeOut(sin_definition))
        trig_definition = Text("As θ increases, the (x,y) coordinates trace the functions", font_size=18)
        trig_definition.to_edge(DOWN, buff=0.4)
        self.play(Write(trig_definition))
        
        # Create sine and cosine graphs
        self.play(Create(sin_graph), Create(cos_graph), run_time=2)
        self.play(Write(sin_label), Write(cos_label))
        self.wait(0.5)
        
        # Key Properties - smaller font, clean spacing
        self.play(FadeOut(trig_definition))
        properties = [
            Text("1. Period of both functions is 2π", font_size=20),
            Text("2. Sine is odd: sin(-θ) = -sin(θ)", font_size=20),
            Text("3. Cosine is even: cos(-θ) = cos(θ)", font_size=20),
            Text("4. sin(θ+π/2) = cos(θ)", font_size=20),
            Text("5. sin²(θ) + cos²(θ) = 1", font_size=20)
        ]
        
        for i, prop in enumerate(properties):
            prop.to_edge(DOWN, buff=0.4)
            self.play(Write(prop))
            self.wait(0.5)  # Reduced wait time for better pacing
            if i < len(properties) - 1:
                self.play(FadeOut(prop))
        
        # Final cleanup - combined into fewer fade out operations for efficiency
        self.play(
            FadeOut(VGroup(
                unit_circle, unit_circle_label,
                radius_line, angle_label,
                sine_line, cosine_line,
                sine_dot, cosine_dot,
                sin_point_label, cos_point_label,
                properties[-1]
            ))
        )
        
        # Final message with smoother transition
        final = Text("This is how sine and cosine functions work!", font_size=28).center()
        self.play(
            FadeOut(VGroup(title, coordinate_system, sin_graph, cos_graph, sin_label, cos_label)),
            FadeIn(final)
        )
        self.wait(1)
