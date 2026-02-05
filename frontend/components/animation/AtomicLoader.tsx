export default function AtomicLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-radial from-[#fdf8ef] to-[#f4e9d8] font-['Montserrat',sans-serif] overflow-hidden relative">
      {/* SVG Filter */}
      <svg style={{ display: 'none' }}>
        <filter id='grainy-texture'>
          <feTurbulence
            type='fractalNoise'
            baseFrequency='0.65'
            numOctaves='3'
            stitchTiles='stitch'
          />
          <feColorMatrix type='saturate' values='0' />
          <feComponentTransfer>
            <feFuncA type='linear' slope='0.15' />
          </feComponentTransfer>
          <feBlend in='SourceGraphic' mode='multiply' />
        </filter>
      </svg>

      {/* Grainy Overlay */}
      <div
        className='absolute inset-0 pointer-events-none z-10 rounded-lg'
        style={{ filter: 'url(#grainy-texture)' }}
      />
      {/* Loader Container */}
      <div className='relative flex flex-col items-center justify-center p-10'>
        <div className='relative w-[200px] h-[200px] flex flex-col items-center justify-center'>
          {/* Atomic Core */}
          <div className='relative w-[120px] h-[120px] mb-10'>
            {/* Nucleus */}
            <div
              className='absolute top-1/2 left-1/2 w-[18px] h-[18px] bg-[#bc4749] rounded-full -translate-x-1/2 -translate-y-1/2 z-5'
              style={{ boxShadow: '0 0 15px rgba(188, 71, 73, 0.3)' }}
            />

            {/* Orbit 1 */}
            <div
              className='absolute inset-0 border-2 border-[#386641]'
              style={{
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                animation: 'rotateOrbit1 3s linear infinite'
              }}
            >
              <div className='absolute w-2.5 h-2.5 bg-[#386641] rounded-full -top-1.5 left-1/2 -translate-x-1/2' />
            </div>

            {/* Orbit 2 */}
            <div
              className='absolute inset-0 border-2 border-[#a7c957]'
              style={{
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                animation: 'rotateOrbit2 4s linear infinite reverse'
              }}
            >
              <div className='absolute w-2.5 h-2.5 bg-[#a7c957] rounded-full -top-1.5 left-1/2 -translate-x-1/2' />
            </div>

            {/* Orbit 3 */}
            <div
              className='absolute inset-0 border-2 border-[#f2cc8f]'
              style={{
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                animation: 'rotateOrbit3 5s linear infinite'
              }}
            >
              <div className='absolute w-2.5 h-2.5 bg-[#f2cc8f] rounded-full -top-1.5 left-1/2 -translate-x-1/2' />
            </div>
          </div>

          {/* Text Section */}
          <div className='text-center'>
            <p className='m-0 font-bold text-[0.8rem] text-[#3d405b] opacity-80 tracking-[0.3em]'>
              CALCULATING...
            </p>
            <div
              className='h-[3px] bg-[#bc4749] mt-2 mx-auto'
              style={{
                animation: 'lineGrow 2s ease-in-out infinite alternate'
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes rotateOrbit1 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes rotateOrbit2 {
          from {
            transform: rotate(60deg) rotate(0deg);
          }
          to {
            transform: rotate(60deg) rotate(360deg);
          }
        }
        @keyframes rotateOrbit3 {
          from {
            transform: rotate(-60deg) rotate(0deg);
          }
          to {
            transform: rotate(-60deg) rotate(360deg);
          }
        }
        @keyframes lineGrow {
          0% {
            width: 0;
            opacity: 0.2;
          }
          100% {
            width: 100%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
