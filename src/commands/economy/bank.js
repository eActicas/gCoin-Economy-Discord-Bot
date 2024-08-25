const { SlashCommandBuilder } = require('discord.js');
const { specialArg, format } = require('../../utils/functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bank')
		.setNameLocalizations({
			'pt-BR': 'banco',
			'es-ES': 'banco',
		})
		.setDescription('Deposit or withdraw your gCoins from the bank, gcoins in the bank increases daily')
		.setDescriptionLocalizations({
			'pt-BR': 'Deposite ou saque gCoins do banco, gcoins no banco aumenta diariamente',
			'es-ES': 'Deposite o retire gCoins del banco, gcoins en el banco aumenta diariamente',
		})
		.setDMPermission(false)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('deposit')
				.setNameLocalizations({
					'pt-BR': 'depositar',
					'es-ES': 'depósito',
				})
				.setDescription('Deposit gCoins to the bank')
				.setDescriptionLocalizations({
					'pt-BR': 'Deposite gCoins no banco',
					'es-ES': 'Deposite gCoins no banco',
				})
				.addStringOption((option) =>
					option
						.setName('gcoins')
						.setDescription(
							'The amount of gCoins to deposit'
						)
						.setDescriptionLocalizations({
							'pt-BR':
								'A quantidade de gCoins para depositar',
							'es-ES':
								'La cantidad de gCoins para depositar',
						})
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('withdraw')
				.setNameLocalizations({
					'pt-BR': 'sacar',
					'es-ES': 'retirar',
				})
				.setDescription('Withdraw gCoins to the bank')
				.setDescriptionLocalizations({
					'pt-BR': 'Saque gCoins do banco',
					'es-ES': 'Retire gCoins del banco',
				})
				.addStringOption((option) =>
					option
						.setName('gcoins')
						.setDescription(
							'The amount of gCoins to withdraw'
						)
						.setDescriptionLocalizations({
							'pt-BR':
								'A quantidade de gCoins para sacar',
							'es-ES':
								'La cantidad de gCoins para retirar',
						})
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('view')
				.setNameLocalizations({
					'pt-BR': 'ver',
					'es-ES': 'ver',
				})
				.setDescription('View bank balance and other useful stats')
				.setDescriptionLocalizations({
					'pt-BR': 'Veja o saldo bancário e outras informações',
					'es-ES': 'Ver el saldo bancario y otras informaciones',
				})
		),
	execute: async ({ user, member, interaction, instance, database }) => {
		await interaction.deferReply().catch(() => {});
		try {
			const subcommand = interaction.options.getSubcommand();
			const gcoins = interaction.options.getString('gcoins');
			const player = await database.player.findOne(user.id);
			const limit = instance.levels[player.rank - 1].bankLimit;

			if (subcommand === 'view') {
				const embed = instance.createEmbed(member.displayColor).addFields({
					name: ':bank: ' + instance.getMessage(interaction, 'BANK'),
					value: `**:coin: ${format(player.bank)} gCoins\n⭐ ${instance.getMessage(
						interaction,
						'BANK_INTEREST'
					)}\n\n:coin: ${format(limit - player.bank)} ${instance.getMessage(
						interaction,
						'BANK_LIMIT'
					)}\n:atm: ${instance.getMessage(interaction, 'BANK_DEPOSIT_LIMIT', {
						GCOINS: format(limit / 2),
					})}**`,
				});
				await instance.editReply(interaction, { embeds: [embed] });
			} else if (subcommand === 'deposit') {
				try {
					var quantity = specialArg(gcoins, player.gcoins);
				} catch {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'BAD_VALUE', {
							VALUE: gcoins,
						}),
					});
					return;
				}

				if (player.gcoins >= quantity) {
					if (player.bank >= limit / 2) {
						await instance.editReply(interaction, {
							content: instance.getMessage(interaction, 'BANK_OVER_LIMIT'),
						});
						return;
					}

					if (quantity + player.bank > limit / 2) {
						quantity = limit / 2 - player.bank;
					}

					player.gcoins -= quantity;
					player.bank += quantity;

					const embed = instance
						.createEmbed(member.displayColor)
						.setTitle(
							instance.getMessage(interaction, 'BANK_DEPOSIT', {
								VALUE: format(quantity),
							})
						)
						.addFields(
							{
								name: instance.getMessage(interaction, 'BALANCE'),
								value: `${format(player.gcoins)} gCoins`,
							},
							{
								name: instance.getMessage(interaction, 'BANK'),
								value: instance.getMessage(interaction, 'BANK_BALANCE', {
									VALUE: format(player.bank),
								}),
							}
						);

					await instance.editReply(interaction, { embeds: [embed] });
				} else {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
					});
				}
			} else if (subcommand === 'withdraw') {
				try {
					var quantity = specialArg(gcoins, player.bank);
				} catch {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'BAD_VALUE', {
							VALUE: gcoins,
						}),
					});
					return;
				}

				if (player.bank >= quantity) {
					player.bank -= quantity;
					player.gcoins += quantity;

					const embed = instance
						.createEmbed(member.displayColor)
						.setTitle(
							instance.getMessage(interaction, 'BANK_WITHDRAW', {
								VALUE: format(quantity),
							})
						)
						.addFields(
							{
								name: instance.getMessage(interaction, 'BALANCE'),
								value: `${format(player.gcoins)} gCoins`,
							},
							{
								name: instance.getMessage(interaction, 'BANK'),
								value: instance.getMessage(interaction, 'BANK_BALANCE', {
									VALUE: format(player.bank),
								}),
							}
						);

					await instance.editReply(interaction, { embeds: [embed] });
				} else {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'BANK_INSUFFICIENT'),
					});
				}
			}
			player.save();
		} catch (error) {
			console.error(`bank: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
			});
		}
	},
};
