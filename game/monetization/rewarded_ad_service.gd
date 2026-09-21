class_name RewardedAdService
extends RefCounted

## Provider-neutral rewarded-ad contract.
## The core game remains fully playable without an ad provider.
## A provider must report completion explicitly; closing/skipping/failure never grants rewards.

signal availability_changed(available: bool)
signal reward_completed(category: int, provider_token: String)
signal reward_failed(category: int, reason: String)

var provider_name := "none"
var available := false

func is_available() -> bool:
	return available

func request_rewarded(category: int) -> bool:
	# Intentionally unavailable in the core/offline build.
	# Android provider integration is an optional platform layer.
	reward_failed.emit(category, "no_provider")
	return false

func configure_provider(name: String, provider_available: bool) -> void:
	provider_name = name
	available = provider_available
	availability_changed.emit(available)

func report_provider_completion(category: int, provider_token: String = "") -> void:
	if not available:
		reward_failed.emit(category, "provider_not_available")
		return
	reward_completed.emit(category, provider_token)

func report_provider_failure(category: int, reason: String = "provider_failure") -> void:
	reward_failed.emit(category, reason)
