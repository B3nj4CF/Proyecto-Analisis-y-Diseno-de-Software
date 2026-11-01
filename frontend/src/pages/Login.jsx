import logoUsm from '../assets/logo-usm.png';
import imgEstudiantes from '../assets/gente-pequena-enfocada-leyendo-libros.png';

function Login({onNavigate}) {
  return (
    <div className="min-h-screen bg-[#161c1f] flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-center gap-10 lg:gap-20">
        <div className="flex flex-col items-center justify-center w-full max-w-md">
          <div className="p-2 mb-4 w-full flex flex-col items-center">
            <div className="flex items-center gap-6 mb-2">
              <img src={logoUsm} alt="Logo UTFSM" className="w-24 lg:w-28 h-auto object-contain" />
              <h1 className="text-white text-6xl lg:text-7xl font-black tracking-widest leading-none">SGM</h1>
            </div>
            <h2 className="text-white text-lg lg:text-xl font-bold mt-3 text-center">Sistema de Gestión de Memorias</h2>
          </div>
          <div className="w-full max-w-xs md:max-w-sm mt-4">
             <img src={imgEstudiantes} alt="Estudiantes" className="w-full h-auto object-contain mix-blend-lighten" />
          </div>
        </div>
        <div className="bg-[#f8f9fa] rounded-[2rem] p-8 lg:p-10 w-full max-w-[400px] shadow-2xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-8 font-mono tracking-widest text-black">Sign in</h2>
          <div className="space-y-5">
            <input type="text" placeholder="User Name" className="w-full border border-gray-400 rounded-xl px-5 py-3 text-sm outline-none focus:border-blue-500 placeholder-black font-mono font-bold bg-transparent" />
            <div className="relative">
              <input type="password" placeholder="Password" className="w-full border border-gray-400 rounded-xl px-5 py-3 text-sm outline-none focus:border-blue-500 placeholder-black font-mono font-bold bg-transparent" />
              <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 font-extrabold text-xs tracking-wider hover:text-gray-600 font-mono text-black">SHOW</button>
            </div>
            <div className="flex justify-between items-center text-[10px] font-extrabold px-2 mt-2 font-mono text-black tracking-tighter">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 rounded-sm border-2 border-gray-400 accent-blue-500 bg-transparent" />
                Remember Me
              </label>
              <a href="#" className="hover:underline">Forgot Password?</a>
            </div>
            <button onClick={() => onNavigate('selector-cargo')} className="w-full bg-gradient-to-r from-[#2dd4bf] to-[#034694] text-white font-bold py-3.5 rounded-xl mt-4 hover:opacity-90 transition-opacity shadow-md text-lg font-sans">
              Sign In
            </button>
            <p className="text-center text-[10px] font-bold mt-6 font-mono text-black">
              Don't have an account?. <button onClick={() => onNavigate('signup')} className="hover:underline font-extrabold underline">Sing Up</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
