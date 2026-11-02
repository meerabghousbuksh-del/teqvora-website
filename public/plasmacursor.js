 let lastX = 0;
        let lastY = 0;

        window.addEventListener('mousemove', function(e) {
            // Calculate distance between mouse points to fill gaps
            const distX = e.pageX - lastX;
            const distY = e.pageY - lastY;
            const distance = Math.hypot(distX, distY);

            // Interpolation: Fill gaps when cursor moves fast
            const steps = Math.max(1, Math.floor(distance / 3));

            for (let i = 0; i < steps; i++) {
                const x = lastX + (distX / steps) * i;
                const y = lastY + (distY / steps) * i;

                createTrailDot(x, y);
            }

            lastX = e.pageX;
            lastY = e.pageY;
        });

        function createTrailDot(x, y) {
            const trail = document.createElement('div');
            trail.className = 'trail';
            trail.style.left = x + 'px';
            trail.style.top = y + 'px';

            document.body.appendChild(trail);

            setTimeout(() => {
                trail.remove();
            }, 500);
        }