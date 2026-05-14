import { useState } from 'react'
import { IoClose, IoLogInOutline, IoMenu, IoPersonAddOutline } from 'react-icons/io5'

const navLinks = [{
    label: 'Home',
    href: '/'
}, {
    label: 'Shop',
    href: '/shop'
}, {
    label: 'Order Tracking',
    href: '/contact'
}]

const Nav = () => {
    const [open, setOpen] = useState(false)
    return (
        <nav className='sticky z-50 top-0 '>
            <div className='container mx-auto px-4 py-4'>
                <div className="flex items-center justify-between">
                    
                        <div className="">
                            <a href="/">
                                <span className=" bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent text-3xl sm:text-2xl font-bold font-display">Sneakr</span>
                            </a>
                        </div>
                         
                      <button
                            className="md:hidden text-primary p-2 rounded-md hover:bg-slate-800 transition-colors"
                            onClick={() => setOpen(v => !v)}
                            aria-label="Toggle menu"
                        >
                            {open ? <IoClose size={24} /> : <IoMenu size={24} />}
                        </button>
                          {/* Desktop menu */}
                        <div className="hidden md:flex items-center space-x-6">
                            {navLinks.map(({ label, href }) => (
                                <a key={href} href={href} className="text-lg font-semibold text-primary font-display hover:underline">
                                    {label}
                                </a>
                            ))}
                        </div>
                    <div className="hidden md:flex items-center space-x-6 font-bold text-primary">
                        <div className="flex items-center border-r border-slate-600 pr-2 text-primary">
                            <IoPersonAddOutline size={24} className="text-primary" />
                            <span>Sign Up</span>
                        </div>
                        <div className="flex items-center align-middle">
                            <span>Login</span>
                            <IoLogInOutline size={24} className="" />
                        </div>

                    </div>
                </div>
                <div className={`md:hidden overflow-hidden transition-all duration-400 delay-200  shadow-lg ${open ? 'max-h-96 mt-3' : 'max-h-0'}`}>
                    <div className="max-w-full mx-auto">
                    <div className="flex flex-col space-y-3 pb-4 pt-4 items-center">
                        {navLinks.map(({ label, href }) => (
                            <a key={label} href={href} className="text-primary hover:text-white transition-colors">
                                {label}
                            </a>
                        ))}

                    </div>
                    <div className="flex flex-col items-center space-x-6 font-bold py-3 text-primary">
                        <div className="flex items-center space-x-2">
                            <IoPersonAddOutline size={24} className="text-primary" />
                            <span>Sign Up</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2 ">
                            <IoLogInOutline size={24} className="text-primary" />
                            <span>Login</span>
                        </div>

                    </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Nav