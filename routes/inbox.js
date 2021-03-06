const express = require('express')

const router = new express.Router()
const {sanitizeParam} = require('express-validator/filter')

const sanitizeAddress = sanitizeParam('address').customSanitizer(
	(value, {req}) => {
		return req.params.address
			.replace(/[^A-Za-z0-9_.+@-]/g, '') // Remove special characters
			.toLowerCase()
	}
)

router.get('^/:address([^@/]+@[^@/]+)', sanitizeAddress, (req, res, _next) => {
	const emailManager = req.app.get('emailManager')
	res.render('inbox', {
		title: req.params.address,
		address: req.params.address,
		mailSummaries: emailManager.getMailSummaries(req.params.address)
	})
})

router.get(
	'^/:address/:uid([0-9]+$)',
	sanitizeAddress,
	async (req, res, next) => {
		try {
			const emailManager = req.app.get('emailManager')
			const mail = await emailManager.getOneFullMail(
				req.params.address,
				req.params.uid
			)
			if (mail) {
				// Emails are immutable, cache if found
				res.set('Cache-Control', 'private, max-age=600')
				res.render('mail', {
					title: req.params.address,
					address: req.params.address,
					mail
				})
			} else {
				next({message: 'email not found', status: 404})
			}
		} catch (error) {
			console.error('error while fetching one email', error)
			next(error)
		}
	}
)

module.exports = router
