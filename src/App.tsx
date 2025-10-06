import { Authenticated, Unauthenticated, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { SignInForm } from './SignInForm'
import { SignOutButton } from './SignOutButton'
import { Toaster } from 'sonner'
import { RadioCMS } from './RadioCMS'

export default function App() {
	return (
		<div className='min-h-screen flex flex-col bg-gray-50'>
			<header className='sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-2 sm:px-8'>
				<h2 className='text-md sm:text-lg md:text-xl pl-4 font-semibold text-primary'>
					архив радио зимы не будет
				</h2>
				<Authenticated>
					<SignOutButton />
				</Authenticated>
			</header>
			<main className='flex-1 p-2 sm:p-8'>
				<Content />
			</main>
			<Toaster />
		</div>
	)
}

function Content() {
	const loggedInUser = useQuery(api.auth.loggedInUser)

	if (loggedInUser === undefined) {
		return (
			<div className='flex justify-center items-center'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
			</div>
		)
	}

	return (
		<div className='max-w-7xl mx-auto'>
			<Authenticated>
				<RadioCMS />
			</Authenticated>

			<Unauthenticated>
				<div className='max-w-md mx-auto'>
					<div className='text-center mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 mb-4'>
							вход в архив
						</h1>
					</div>
					<SignInForm />
				</div>
			</Unauthenticated>
		</div>
	)
}
